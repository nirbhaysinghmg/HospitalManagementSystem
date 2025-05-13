import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HMSService:
    """
    Mock Hospital Management System service
    In a real implementation, this would connect to the actual HMS
    """
    
    def __init__(self):
        # Mock data for demonstration
        self.data = {
            "departments": [
                {"id": "cardio", "name": "Cardiology", "floor": 3},
                {"id": "neuro", "name": "Neurology", "floor": 4},
                {"id": "ortho", "name": "Orthopedics", "floor": 2},
                {"id": "pedia", "name": "Pediatrics", "floor": 1},
            ],
            "patients": {
                "P12345": {
                    "name": "John Doe",
                    "age": 45,
                    "upcoming_appointments": "Dr. Smith, Cardiology, June 15, 2023, 10:00 AM"
                },
                "P67890": {
                    "name": "Jane Smith",
                    "age": 35,
                    "upcoming_appointments": "Dr. Johnson, Neurology, June 18, 2023, 2:30 PM"
                }
            }
        }
        
        logger.info("HMSService initialized with mock data")
    
    async def get_patient_info(self, patient_id):
        """Get patient information by ID"""
        logger.info(f"Retrieving information for patient {patient_id}")
        
        if patient_id in self.data["patients"]:
            return self.data["patients"][patient_id]
        
        logger.warning(f"Patient {patient_id} not found")
        return None
    
    async def get_departments(self):
        """Get list of departments"""
        return self.data["departments"]
    
    async def book_appointment(self, patient_id, department_id, date_time):
        """Book an appointment (mock implementation)"""
        logger.info(f"Booking appointment for patient {patient_id} in {department_id} at {date_time}")
        
        # In a real implementation, this would create an appointment in the HMS
        # For now, just return a success message
        return {
            "success": True,
            "appointment_id": "A" + str(hash(f"{patient_id}{department_id}{date_time}"))[:8],
            "message": "Appointment booked successfully"
        }









