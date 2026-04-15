'use strict';

/**
 * MCP server: tv-summary
 *
 * Exposes a single tool – get_tv_show_details – that fetches structured
 * data for a TMDB TV show ID and returns it as JSON text.  The Express
 * backend spawns this file as a child process (stdio transport) and
 * forwards the tool to Claude so Claude can call it while generating
 * a TV show summary.
 *
 * Transport: stdio  (parent process communicates over stdin/stdout)
 * Required env: TMDB_API_KEY
 */

const https = require('https');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

// ---------------------------------------------------------------------------
// TMDB helper
// ---------------------------------------------------------------------------

function fetchTMDB(path) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            hostname: 'api.themoviedb.org',
            port: null,
            path,
            headers: {},
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString()));
                } catch (e) {
                    reject(new Error('TMDB response was not valid JSON'));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// ---------------------------------------------------------------------------
// MCP server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
    name: 'tv-summary',
    version: '1.0.0',
});

/**
 * Tool: get_tv_show_details
 *
 * Fetches name, overview, genres, first/last air date, number of seasons,
 * number of episodes, vote average, and the top-5 cast members for a TMDB
 * TV show. Keeping the payload small means Claude stays within max_tokens
 * and responds quickly.
 */
server.tool(
    'get_tv_show_details',
    'Fetch structured details for a TV show from TMDB by its numeric ID',
    { showId: z.number().int().positive().describe('TMDB numeric TV show ID') },
    async ({ showId }) => {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return {
                content: [{ type: 'text', text: 'Error: TMDB_API_KEY environment variable is not set' }],
                isError: true,
            };
        }

        const path =
            `/3/tv/${showId}` +
            `?language=en-US` +
            `&append_to_response=credits` +
            `&api_key=${apiKey}`;

        let data;
        try {
            data = await fetchTMDB(path);
        } catch (err) {
            return {
                content: [{ type: 'text', text: `Error fetching from TMDB: ${err.message}` }],
                isError: true,
            };
        }

        if (data.status_code) {
            return {
                content: [{ type: 'text', text: `TMDB error ${data.status_code}: ${data.status_message}` }],
                isError: true,
            };
        }

        const topCast = (data.credits?.cast ?? [])
            .slice(0, 5)
            .map((c) => ({ name: c.name, character: c.character }));

        const summary = {
            id: data.id,
            name: data.name,
            overview: data.overview,
            genres: (data.genres ?? []).map((g) => g.name),
            first_air_date: data.first_air_date,
            last_air_date: data.last_air_date || null,
            number_of_seasons: data.number_of_seasons || null,
            number_of_episodes: data.number_of_episodes || null,
            vote_average: data.vote_average,
            top_cast: topCast,
        };

        return {
            content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        };
    }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    process.stderr.write(`[tv-summary-server] fatal: ${err.message}\n`);
    process.exit(1);
});
