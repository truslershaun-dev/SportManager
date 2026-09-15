// DEPRECATED - superseded by functions/api/[[path]].js
//
// This file used the Worker-style `export default { fetch(request, env) }`
// export, which Cloudflare Pages Functions do NOT support for files under
// /functions (that syntax only works in a top-level _worker.js "advanced
// mode" file). Because of that, none of the /api/* routes defined here were
// ever actually reachable when deployed - every request 404'd.
//
// The working replacement lives at functions/api/[[path]].js, using the
// onRequest export Pages Functions expect, with the same routes.
//
// I couldn't delete this file automatically (no file-delete access to your
// local folder from this session) - please delete functions/api.js yourself
// (in VS Code or GitHub Desktop) so it doesn't sit around unused.
export {};
