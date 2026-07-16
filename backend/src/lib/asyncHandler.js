// Express 4 no captura automáticamente los rechazos de promesas en
// handlers async: sin esto, un error lanzado dentro de un handler
// `async (req, res) => {...}` dejaría la petición colgada en vez de
// llegar al middleware de errores.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
