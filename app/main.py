from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import logging

from app.services.gemini_service import GeminiService
from app.services.hms_service import HMSService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Healthcare AI Assistant")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(json.dumps({"text": message}))

    async def send_end_signal(self, websocket: WebSocket):
        await websocket.send_text(json.dumps({"end": True}))

manager = ConnectionManager()

# Models for REST API
class ChatRequest(BaseModel):
    message: str
    patient_id: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    actions: Optional[Dict[str, Any]] = None

# Service dependencies
def get_gemini_service():
    return GeminiService()

def get_hms_service():
    return HMSService()

# WebSocket endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    logger.info(f"WebSocket connection attempt from {websocket.client}")
    
    try:
        await manager.connect(websocket)
        
        # Get services
        gemini_service = GeminiService()
        hms_service = HMSService()
        
        while True:
            # Receive and parse the message
            data = await websocket.receive_text()
            logger.info(f"Received message: {data[:100]}...")  # Log first 100 chars
            
            try:
                data_json = json.loads(data)
                
                user_input = data_json.get("user_input", "")
                user_id = data_json.get("user_id", "anonymous")
                patient_id = data_json.get("patient_id")
                
                logger.info(f"Processing message from user {user_id}")
                
                # Get patient context if patient_id is provided
                patient_context = None
                if patient_id:
                    patient_info = await hms_service.get_patient_info(patient_id)
                    if patient_info:
                        patient_context = f"Patient name: {patient_info.get('name', 'Unknown')}"
                        if 'upcoming_appointments' in patient_info:
                            patient_context += f"\nUpcoming appointments: {patient_info['upcoming_appointments']}"
                
                # Get response from Gemini
                ai_response = await gemini_service.get_response(user_input, patient_context)
                
                # Send response back to the client
                await manager.send_message(ai_response, websocket)
                await manager.send_end_signal(websocket)
                
            except json.JSONDecodeError:
                logger.error("Error: Invalid JSON received")
                await manager.send_message("Sorry, I couldn't process that message.", websocket)
                await manager.send_end_signal(websocket)
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected from {websocket.client}")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in WebSocket: {e}")
        manager.disconnect(websocket)

# REST API endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    gemini_service: GeminiService = Depends(get_gemini_service),
    hms_service: HMSService = Depends(get_hms_service)
):
    """Process a chat message and return AI response"""
    
    # Get patient context if patient_id is provided
    patient_context = None
    if request.patient_id:
        patient_info = await hms_service.get_patient_info(request.patient_id)
        if patient_info:
            patient_context = f"Patient name: {patient_info.get('name', 'Unknown')}"
            if 'upcoming_appointments' in patient_info:
                patient_context += f"\nUpcoming appointments: {patient_info['upcoming_appointments']}"
    
    # Get response from Gemini
    ai_response = await gemini_service.get_response(request.message, patient_context)
    
    return ChatResponse(
        response=ai_response,
        actions=None
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


