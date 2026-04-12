'use strict';

/**
 * MCP server: movie-summary
 *
 * Exposes a single tool – get_movie_details – that fetches structured
 * data for a TMDB movie ID and returns it as JSON text.  The Express
 * backend spawns this file as a child process (stdio transport) and
 * forwards the tool to Claude so Claude can call it while generating
 * a movie summary.
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

/**
 * Fetch a URL from api.themoviedb.org and return the parsed JSON.
 * Mirrors the getdata() pattern used in routes/index.js.
 */
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
    name: 'movie-summary',
    version: '1.0.0',
});

/**
 * Tool: get_movie_details
 *
 * Fetches title, tagline, overview, genres, release date, runtime,
 * vote average, and the top-5 cast members for a TMDB movie.
 * Keeping the payload small means Claude stays within max_tokens
 * and responds quickly.
 */
server.tool(
    'get_movie_details',
    'Fetch structured details for a movie from TMDB by its numeric ID',
    { movieId: z.number().int().positive().describe('TMDB numeric movie ID') },
    async ({ movieId }) => {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return {
                content: [{ type: 'text', text: 'Error: TMDB_API_KEY environment variable is not set' }],
                isError: true,
            };
        }

        const path =
            `/3/movie/${movieId}` +
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
            // TMDB returns a status_code field on errors (e.g. 34 = not found)
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
            title: data.title,
            tagline: data.tagline || null,
            overview: data.overview,
            genres: (data.genres ?? []).map((g) => g.name),
            release_date: data.release_date,
            runtime_minutes: data.runtime || null,
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
    // All communication happens via stdin/stdout from this point.
    // Do not write to stdout after this line — it would corrupt the MCP stream.
}

main().catch((err) => {
    process.stderr.write(`[movie-summary-server] fatal: ${err.message}\n`);
    process.exit(1);
});
