// https://github.com/baryon/tracer/issues/43
export const logger = require('tracer')
  .console(
    // https://github.com/baryon/tracer/issues/91#event-1968798299
    {
    // format: "{timestamp: '{{timestamp}}', title: '{{title}}', file: '{{file}}', line:'{{line}}', method: '{{method}}', message: '{{message}}' }"
      transport: function (data) {
        if (process.env.STAGE) {
          console.log(JSON.stringify({
            timestamp: data.timestamp,
            title: data.title,
            file: data.file,
            line: data.line,
            method: data.method,
            message: data.message
          }))
        } else {
          console.log(data.message)
        }
      }
    })
