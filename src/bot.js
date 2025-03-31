// index.js (Asegúrate que package.json tenga "type": "module")

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Configuración de las variables APIKEYS
import dotenv from "dotenv";
dotenv.config();

// Gestión del historial (usaremos un array simple por ahora)

const MAX_HISTORIAL_MESSAGES = 10; // Máximo número de mensajes (entrada/salida)
let chatHistory = []; // Almacenará objetos AIMessage y HumanMessage

// Configuración del modelo Gemini

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite", // Asegúrate que este modelo esté disponible para tu API Key
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

// ChatPromptTemplate con placeholder para el historial
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un asistente virtual para vendedores de tarjetas de crédito. Proporcionas información sobre los tipos de tarjetas disponibles, sus beneficios, requisitos para solicitarlas, promociones vigentes y ayudas a los vendedores a alcanzar sus metas de venta.
    
    Tipos de Tarjetas Disponibles:
    - Tarjeta Clásica: (Beneficios, requisitos, tasas de interés, etc.)
    - Tarjeta Oro: (Beneficios, requisitos, tasas de interés, etc.)
    - Tarjeta Platino: (Beneficios, requisitos, tasas de interés, etc.)
    - Tarjeta Black: (Beneficios, requisitos, tasas de interés, etc.)
    
    Vendedor:
    - Nombre: Pepe Pecas
    - Número de Vendedor: 666
    - Sucursal: Banco BBCITO MX
    
    Metas/Ventas: 
    - Meta Diaria: 5 tarjetas
    - Ventas Hoy: 3 tarjetas
    
    Promociones Vigentes:
    - 2x1 en cines, 10% descuento en restaurantes 
    
    Requisitos Generales:
    - identificación oficial, comprobante de domicilio, historial crediticio, etc.
    
    Responde únicamente a preguntas relacionadas con los tipos de tarjetas, sus beneficios, requisitos, promociones, ventas del vendedor y metas. Si la pregunta es sobre otro tema, amablemente indica que no tienes información al respecto.`,
  ],
  // Placeholder para insertar el historial de chat
  new MessagesPlaceholder("chat_history"),
  ["user", "{input}"], // Placeholder para la entrada del usuario
]);

// Parser para obtener la respuesta como texto
const outputParser = new StringOutputParser();

// Crear la cadena (RunnableSequence)
// prompt -> model -> outputParser
const chain = RunnableSequence.from([prompt, model, outputParser]);

// Función para interactuar con el chatbot
async function interactuarConChatbot(inputUsuario) {
  console.log(`\nUsuario: ${inputUsuario}`);

  // Truncar historial si excede el límite
  // Mantenemos los últimos MAX_HISTORIAL_MESSAGES mensajes
  if (chatHistory.length > MAX_HISTORIAL_MESSAGES) {
    chatHistory = chatHistory.slice(-MAX_HISTORIAL_MESSAGES);
  }

  try {
    // Invocar la cadena con la entrada y el historial actual
    const respuesta = await chain.invoke({
      input: inputUsuario,
      chat_history: chatHistory, // Pasar el historial actual
    });

    // Mostrar la respuesta
    console.log("Asistente:", respuesta);

    // Agregar la interacción actual al historial
    chatHistory.push(new HumanMessage(inputUsuario));
    chatHistory.push(new AIMessage(respuesta));
  } catch (error) {
    console.error("Error al interactuar con el chatbot:", error);
    // Considera cómo manejar errores específicos de la API o del modelo
    if (error.message && error.message.includes("429")) {
      console.log(
        "Asistente: Alcanzaste el límite de peticiones. Intenta de nuevo más tarde."
      );
    } else if (error.message && error.message.includes("API key not valid")) {
      console.log(
        "Asistente: La clave API de Google no es válida. Verifica tu archivo .env."
      );
    } else {
      console.log("Asistente: Hubo un problema al procesar tu solicitud.");
    }
  }
}

// Función para probar la conversación
async function probarConversacion() {
  const entradasUsuario = [
    "Hola, ¿qué tarjetas de crédito ofrecen?",
    "¿Cuáles son los beneficios de la Tarjeta Oro?",
    "¿Qué requisitos necesito para solicitar la Tarjeta Platino?",
    "¿Hay alguna promoción vigente con la Tarjeta Clásica?",
    "¿Cuántas tarjetas he vendido hoy?",
    "¿Cuál es mi meta de ventas diaria?",
    "¿Me puedes recordar mi número de vendedor y sucursal?",
    "¿Qué pasa si un cliente no cumple con todos los requisitos?",
    "¿Cuál es la tasa de interés de la Tarjeta Black?",
    "¿Qué promociones hay en hoteles con la tarjeta platino?",
    "¿Me podrías ayudar a manejar la objeción de un cliente que no quiere la tarjeta por la anualidad?",
    "¿Cómo puedo aumentar mis ventas este mes?", // Pregunta para probar asesoramiento
    // Puedes añadir más preguntas para probar diversas interacciones
  ];

  console.log("--------------------------");

  for (const entrada of entradasUsuario) {
    await interactuarConChatbot(entrada);
    // Pausa opcional para simular una conversación más natural o evitar límites de tasa
    // await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Iniciar la prueba
probarConversacion();
