module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            includeSource: {
                files: ['public/**/*.js', 'public/**/*.css'],
                tasks: ['includeSource'],
                options: {
                    event: ['added', 'deleted']
                }
            }
        },
        includeSource: {
            options: {
                basePath: 'public'
            },
            views: {
                files: [{
                    expand: true,
                    src: 'index.ejs',
                    dest: 'index.ejs',
                    ext: '.html'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-include-source');

    grunt.registerTask('default', ['includeSource']);
};