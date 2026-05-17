import WebSocketMessageTypes from "./enums/WebSocketMessageTypes";

export interface WebsocketMessage<T = any> {
  type: WebSocketMessageTypes;
  data: T;
}
