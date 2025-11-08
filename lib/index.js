"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = { enumerable: true, get: function () { return m[k]; } };
  Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proto = exports.makeWASocket = exports.listenIncomingCall = exports.rejectCall = exports.acceptCall = exports.callEnd = exports.callOffer = void 0;

const WAProto_1 = require("../WAProto");
Object.defineProperty(exports, "proto", { enumerable: true, get: function () { return WAProto_1.proto; } });

const Socket_1 = __importDefault(require("./Socket"));
const { CallModel, CallStore, UserPrefs, websocket, CALL_STATES } = require("../../whatsapp");
exports.makeWASocket = Socket_1.default;

async function callOffer(sock, to, isVideo = false) {
  try {
    const id = Date.now().toString();
    const content = [
      { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
      { tag: "net", attrs: { medium: "3" } },
      { tag: "encopt", attrs: { keygen: "2" } }
    ];
    if (isVideo) content.push({ tag: "video", attrs: { orientation: "0", enc: "vp8", dec: "vp8" } });

    const node = {
      tag: "call",
      attrs: { to: to.includes("@s.whatsapp.net") ? to : to + "@s.whatsapp.net", id },
      content: [
        {
          tag: "offer",
          attrs: {
            "call-id": id,
            "call-creator": sock.user.id
          },
          content
        }
      ]
    };

    await sock.query(node);
    console.log(`[CALL] Llamada ofrecida a ${to}`);
    return id;
  } catch (err) {
    console.error("[CALL ERROR] callOffer:", err);
  }
}

async function callEnd(sock, to, callId) {
  try {
    const node = {
      tag: "call",
      attrs: { to: to.includes("@s.whatsapp.net") ? to : to + "@s.whatsapp.net", id: Date.now().toString() },
      content: [
        {
          tag: "terminate",
          attrs: {
            "call-id": callId,
            "call-creator": sock.user.id
          }
        }
      ]
    };
    await sock.query(node);
    console.log(`[CALL] Llamada terminada con ${to}`);
    return true;
  } catch (err) {
    console.error("[CALL ERROR] callEnd:", err);
    return false;
  }
}

async function acceptCall(callId) {
  try {
    let call = callId
      ? CallStore.get(callId)
      : CallStore.findFirst(c => c.getState() === CALL_STATES.INCOMING_RING || c.isGroup);

    if (!call) throw new Error(`Call ${callId || "<empty>"} not found`);

    const content = [
      websocket.smax("audio", { enc: "opus", rate: "16000" }, null),
      websocket.smax("audio", { enc: "opus", rate: "8000" }, null)
    ];

    if (call.isVideo) {
      content.push(
        websocket.smax("video", {
          orientation: "0",
          screen_width: "1920",
          screen_height: "1080",
          device_orientation: "0",
          enc: "vp8",
          dec: "vp8"
        }, null)
      );
    }

    const node = websocket.smax(
      "call",
      { to: call.peerJid.toString({ legacy: true }), id: websocket.generateId() },
      [
        websocket.smax("accept", {
          "call-id": call.id,
          "call-creator": call.peerJid.toString({ legacy: true })
        }, content)
      ]
    );

    await websocket.sendSmaxStanza(node);
    console.log(`[CALL] Llamada aceptada: ${call.id}`);
    return true;
  } catch (err) {
    console.error("[CALL ERROR] acceptCall:", err);
    return false;
  }
}

async function rejectCall(callId) {
  try {
    let call = callId
      ? CallStore.get(callId)
      : CallStore.findFirst(c => c.getState() === CALL_STATES.INCOMING_RING || c.isGroup);

    if (!call) throw new Error(`Call ${callId || "<empty>"} not found`);

    const node = websocket.smax(
      "call",
      {
        from: UserPrefs.getMaybeMeUser().toString({ legacy: true }),
        to: call.peerJid.toString({ legacy: true }),
        id: websocket.generateId()
      },
      [
        websocket.smax("reject", {
          "call-id": call.id,
          "call-creator": call.peerJid.toString({ legacy: true }),
          count: "0"
        }, null)
      ]
    );

    await websocket.sendSmaxStanza(node);
    console.log(`[CALL] Llamada rechazada: ${call.id}`);
    return true;
  } catch (err) {
    console.error("[CALL ERROR] rejectCall:", err);
    return false;
  }
}

function listenIncomingCall(sock, autoAccept = false, durationMs = 20 * 60 * 1000) {
  sock.ev.on("call", async (call) => {
    try {
      if (call.type === "offer") {
        console.log(`[CALL] Llamada entrante de ${call.from} (${call.isVideo ? "video" : "audio"})`);
        if (autoAccept) {
          await acceptCall(call.id);
          console.log("[CALL] Llamada aceptada automáticamente.");
          setTimeout(() => {
            console.log(`[CALL] Finalizando llamada automáticamente tras ${durationMs / 60000} minutos.`);
            callEnd(sock, call.from, call.id);
          }, durationMs);
        } else {
          console.log("[CALL] Esperando aceptación manual...");
        }
      }
    } catch (err) {
      console.error("[CALL ERROR] listenIncomingCall:", err);
    }
  });
}

exports.callOffer = callOffer;
exports.callEnd = callEnd;
exports.acceptCall = acceptCall;
exports.rejectCall = rejectCall;
exports.listenIncomingCall = listenIncomingCall;

__exportStar(require("../WAProto"), exports);
__exportStar(require("./Utils"), exports);
__exportStar(require("./Types"), exports);
__exportStar(require("./Store"), exports);
__exportStar(require("./Defaults"), exports);
__exportStar(require("./WABinary"), exports);
__exportStar(require("./WAM"), exports);
__exportStar(require("./WAUSync"), exports);
exports.default = Socket_1.default;
