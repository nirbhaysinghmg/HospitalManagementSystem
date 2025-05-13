import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure the Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY not found in environment variables")
    
genai.configure(api_key=api_key)

class GeminiService:
    def __init__(self):
        # Initialize with Gemini model
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Healthcare-specific system prompt
        self.system_prompt = """
        You are a healthcare assistant for a hospital. Respond professionally and empathetically.
        Only provide medically accurate information. For serious medical concerns, always 
        advise patients to contact emergency services or their doctor. Respect patient privacy
        and confidentiality. Never diagnose conditions or prescribe treatments.
        """
        
        logger.info("GeminiService initialized")
    
    async def get_response(self, user_message, patient_context=None):
        """Get a response from Gemini AI"""
        try:
            # Construct the prompt with patient context if available
            prompt = self.system_prompt
            
            if patient_context:
                prompt += f"\n\nPatient Context: {patient_context}"
                
            prompt += f"\n\nUser: {user_message}\nAssistant:"
            
            logger.info(f"Sending prompt to Gemini (length: {len(prompt)})")
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Extract and return the text
            response_text = response.text
            logger.info(f"Received response from Gemini (length: {len(response_text)})")
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error getting response from Gemini: {e}")
            return "I'm sorry, I'm having trouble processing your request right now. Please try again later."






