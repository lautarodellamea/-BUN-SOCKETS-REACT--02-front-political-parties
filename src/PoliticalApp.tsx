import { WebSocketProvider } from "./context/WebSocketContext"
import { HomePage } from "./pages/HomePage"



function PoliticalApp() {

  return (

    // aca podemos cambiar el url de la conexión a la API, y así conectar a diferentes servidores de la API, podriamos pasar un array de urls si tenemos mas de un servidor de la API
    <WebSocketProvider url="ws://localhost:3200">
      <HomePage />
    </WebSocketProvider>
  )
}

export default PoliticalApp
