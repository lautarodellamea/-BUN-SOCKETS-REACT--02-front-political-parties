import { createContext, useCallback, useEffect, useState } from "react";


type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// tipados especificos a nuestra aplicacion
export interface SocketMessage {
  type: SendType;
  payload: unknown;
}
export interface SocketResponse {
  type: ResponseType;
  payload: unknown;
}


// son los mismos que en la carpeta types del back
type SendType =
  | "GET_PARTIES"
  | "ADD_PARTY"
  | "UPDATE_PARTY"
  | "DELETE_PARTY"
  | "INCREMENT_VOTES"
  | "DECREMENT_VOTES";

type ResponseType =
  | "PARTIES_LIST"
  | "PARTY_ADDED"
  | "PARTY_UPDATED"
  | "PARTY_DELETED"
  | "VOTES_UPDATED"
  | "ERROR";


interface WebSocketContextState {
  status: ConnectionStatus;
  lastMessage: SocketResponse | null;
  send: (message: SocketMessage) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const WebSocketContext = createContext({} as WebSocketContextState);


interface Props {
  children: React.ReactNode;
  url: string;
}

export const WebSocketProvider = ({ children, url }: Props) => {


  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [lastMessage, setLastMessage] = useState<SocketResponse | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      setSocket(ws);
      setStatus('connected');
    });
    ws.addEventListener('close', () => {
      setSocket(null);
      setStatus('disconnected');
    });
    ws.addEventListener('error', () => {
      console.log({ error: 'Error al conectar al servidor' });
      setStatus('error');
    });


    // funcion para escuchar mensajes del servidor
    ws.addEventListener('message', (event) => {
      console.log({ message: event.data });

      const message = JSON.parse(event.data);
      setLastMessage(message);
      console.log({ message });
    });

    return ws;
  }, [url]);


  useEffect(() => {
    const ws = connect();

    // TODO: message / onMessage

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  }, [connect]);


  // funcnion basica de reconexion
  useEffect(() => {

    let interval: ReturnType<typeof setInterval>;

    if (status === 'disconnected') {
      // aca es util poner un valor random en ms para que en el caso de que el servidor este caido, no se intente conectar inmediatamente todos a la vez
      interval = setInterval(() => {
        console.log('Reconnecting every 1 second...')
        connect();
      }, 1000);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      }
    }
  }, [status, connect]);


  // funcion para enviar mensajes al servidor
  const send = (message: SocketMessage) => {
    if (!socket) throw new Error('Socket not connected');
    if (status !== 'connected') throw new Error('Socket not connected (status)');

    const jsonMessage = JSON.stringify(message);
    socket.send(jsonMessage)

  }




  return (
    <WebSocketContext value={{ status: status, send: send, lastMessage: lastMessage }}>
      {children}
    </WebSocketContext>
  )

}