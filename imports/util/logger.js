// https://github.com/baryon/tracer/issues/43
export const logger = require('tracer')
  .console(
    // https://github.com/baryon/tracer/issues/91#event-1968798299
    {
    // format: "{timestamp: '{{timestamp}}', title: '{{title}}', file: '{{file}}', line:'{{line}}', method: '{{method}}', message: '{{message}}' }"
      transport: function (data) {
        if (process.env.ROOT_URL !== 'http://localhost:3000/') {
          console.log(JSON.stringify({
            message: data.message,
            timestamp: data.timestamp,
            method: data.method,
            title: data.title,
            file: data.file,
            line: data.line
          }))
        } else {
          console[data.method] ? console[data.method](data.message) : console.log(data.message)
        }
      },
      methods: ['request']
    })
