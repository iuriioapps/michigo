/**
 * The two names of the handshake that gives the renderer its oRPC port. The
 * preload imports this file, so it holds plain strings and imports nothing.
 */

/** The window message that carries the renderer's port to the preload. */
export const RPC_PORT_MESSAGE = "michigo:rpc-port";

/** The IPC channel on which the preload forwards that port to main. */
export const RPC_CONNECT = "rpc:connect";
