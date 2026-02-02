import type { ChartData } from "chart.js";
import { use, useCallback, useEffect, useState } from "react";
import { WebSocketContext, type SocketResponse } from "../context/WebSocketContext";
import type { Party } from "../types";

const PARTY_COLORS = [
  { bg: 'rgba(220, 53, 69, 0.2)', border: 'rgb(220, 53, 69)' },
  { bg: 'rgba(0, 123, 255, 0.2)', border: 'rgb(0, 123, 255)' },
  { bg: 'rgba(40, 167, 69, 0.2)', border: 'rgb(40, 167, 69)' },
  { bg: 'rgba(255, 193, 7, 0.2)', border: 'rgb(255, 193, 7)' },
  { bg: 'rgba(255, 152, 0, 0.2)', border: 'rgb(255, 152, 0)' },
  { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgb(153, 102, 255)' },
  { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgb(75, 192, 192)' },
  { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgb(255, 99, 132)' },
];


export const useParties = () => {

  // usamos el context
  const { status, lastMessage, send } = use(WebSocketContext);

  const [parties, setParties] = useState<Party[]>([]);


  // el useCallback no es necesario si estuvieramos trabajando con el compilador de react
  const handleLastMessage = useCallback((message: SocketResponse) => {

    const { type, payload } = message;
    console.log({ type, payload });

    switch (type) {
      case 'PARTIES_LIST':
        setParties(payload as Party[]);
        break;

      case 'PARTY_UPDATED':
      case 'VOTES_UPDATED':
        {
          const updatedParty = message.payload as Party;
          setParties(prev => {
            return prev.map(party => party.id === updatedParty.id ? updatedParty : party);
          })
          break;
        }

      case 'PARTY_ADDED':
        {
          const newParty = message.payload as Party;
          setParties(prev => [...prev, newParty]);
          break;
        }

      case 'PARTY_DELETED':
        {
          const deletedParty = message.payload as Party;
          setParties(prev => prev.filter(party => party.id !== deletedParty.id));
          break;
        }

      default:
        console.error('Unknown message type', message.type);
        break;
    }
  }, [setParties]);

  useEffect(() => {
    if (lastMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleLastMessage(lastMessage);
    }
  }, [lastMessage, handleLastMessage]);

  const updatePartyName = (id: string, newName: string) => {

    send({ type: 'UPDATE_PARTY', payload: { id, name: newName } });

    // setParties(
    //   prev => prev.map(party => party.id === id ? { ...party, name: newName } : party)
    // );
  }

  const updatePartyVotes = (id: string, value: number) => {

    const type = value > 0 ? 'INCREMENT_VOTES' : 'DECREMENT_VOTES';
    send({ type: type, payload: { id: id } });


    // setParties(
    //   prev => prev.map(party => party.id === id ? { ...party, votes: Math.max(0, party.votes + value) } : party)
    // );
  }

  const addParty = () => {

    const color = PARTY_COLORS[parties.length % PARTY_COLORS.length];

    send({
      type: 'ADD_PARTY', payload: {
        name: `Nuevo Partido ${parties.length + 1}`,
        color: color.bg,
        borderColor: color.border
      }
    });

    // const newParty: Party = {
    //   id: crypto.randomUUID(),
    //   name: `Nuevo Partido ${parties.length + 1}`,
    //   votes: 0,
    //   borderColor: color.border,
    //   color: color.bg,
    // }
    // setParties([...parties, newParty]);
  }

  const removeParty = (id: string) => {
    send({ type: 'DELETE_PARTY', payload: { id: id } });
    // const currentParties = parties.filter(party => party.id !== id);
    // setParties(currentParties);
  }




  const chartData: ChartData<'bar'> = {
    labels: parties.map((p) => p.name),
    datasets: [
      {
        data: parties.map((p) => p.votes),
        backgroundColor: parties.map((p) => p.color),
        borderColor: parties.map((p) => p.borderColor),
        borderWidth: 2,
      },
    ],
  };


  return {
    status,
    parties,
    updatePartyName,
    updatePartyVotes,
    addParty,
    removeParty,
    chartData,
  }

}
