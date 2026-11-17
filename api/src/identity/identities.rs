// use serde::{Deserialize, Serialize};

// #[derive(Debug, Serialize, Deserialize)]
// pub struct VerificationDocumentInput {
//     pub user_id: String,
//     pub file_data: Vec<u8>,      // The file as bytes
//     pub file_name: String,       // Original filename with extension
//     pub file_type: String,       // MIME type (e.g., "image/jpeg", "application/pdf")
// }
 

// #[derive(Debug, Serialize, Deserialize)]
// pub struct VerificationDocument {
//     pub id: String,
//     pub user_id: String,
//     pub file_data: Vec<u8>,      // The actual file content
//     pub file_name: String,       // Original filename
//     pub file_type: String,       // MIME type
//     pub file_size: i64,          // Size in bytes (useful for limits)
//     pub verification_status: String, // "pending", "approved", "rejected"
//     pub verified_by: Option<String>, // Admin who verified it
//     pub verified_at: Option<String>, // When it was verified
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserLogin{
//     pub email:String,
//     pub password:String,
// }
// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserClient {
//     pub name: String,
//     pub last_name: String,
//     pub date_of_birth: String,
//     pub email: String,
//     pub phone: String,
//     pub password_hash: String,
//     pub user_type: String, // "gov", "student", or "police"
// }

// user_session.rs

use serde::{Deserialize, Serialize};
use std::any::Any;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AssignmentType {
    Speaking,
    Listening,
    Writing,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SpeakingPhase {
    DescribeImage,
    RepeatAudio,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceAccess{
    pub token: String, 
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo{
    pub id: String, 
    pub name: String,
    pub bonded: String,
    pub uploaded_by: String, 
    pub uploaded_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub code: String,
    pub group: String,
    pub teacher: String,
    pub password: String,
    pub assignments: Vec<Assignment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeacherLogin{
    pub name: String, 
    pub password: String, 
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Teacher {
    pub id: String,
    pub name: String,
    pub password_hash: String,
    pub salt : String  , 
    pub created_at: String,
    pub updated_at: String,
}

 

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserLogin {
    pub code: String,
    pub password: String,
    pub auth: String, 
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group{
    pub size: usize,  // 0...30
    pub name: String, // A...Z
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentPassword {
    pub code: String,
    pub password: String,
}
 

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct RequestGroupAction{
    pub group: String,
    pub token: String, 
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGroupRequest{
    pub name: String,
    pub size: String,
    pub token: String,
}


/*
    Teacher 
    isActive
*/
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session{
    pub id: String, 
    pub token: String,
    pub user: String,
    pub updated_at: String,
    pub created_at: String,
    pub ends_at: String,
}




#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeakingUnit {
    pub id: String,
    pub phase: SpeakingPhase,
    /// For describe_image: image url | For repeat_audio: audio url
    pub content: serde_json::Value,
    /// Only for describe_image phase
    #[serde(skip_serializing_if = "Option::is_none")]
    pub helpful_sentence: Option<String>,
    /// Audio blob from student
    pub answer: serde_json::Value,
    pub grade: Option<String>,
    pub thinking_time: i64,
    pub speaking_time: i64, 
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeakingAssignment {
    pub id: String,
    #[serde(rename = "type")]
    pub assignment_type: AssignmentType, // = AssignmentType::Speaking
    pub grade: Option<String>,
    pub units: Vec<SpeakingUnit>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawAssigment{
    pub id: String,
    pub teacher: String, 
    pub json: String, 
    pub max_attempts: u32,
    pub label: String,
    pub assigment_type: String,
    pub created_date: String, 
    pub updated_date: String, 
    pub bond: String, 
    
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssigmentInfo{
    pub label: String,
    pub assigment_type: String,
    pub grade: String , 
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawAssigmentRequest{
    pub json: String, 
    pub max_attempts: u32, 
    pub label: String,
    pub assigment_type: String,
    pub bond: String, 
}
 
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssigmentAttempt {
    pub id: String,
    pub user: String,
    pub attempt: u32,
    pub max_attempts: u32, 
    pub assigment_id: String,
    pub assigment_label: String, 
    pub assigment_type: String, 
    pub grade: String, 
    pub window: u32,
    pub json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct AttemptRow {
    pub id: String,
    pub user: String,
    pub code: String,
    pub group: String,
    pub attempt: u32,
    pub max_attempts: u32,
    pub assigment_id: String,
    pub assigment_label: String,   // ← add
    pub assigment_type: String,    // ← add
    pub grade: String,
    pub window: u32,
    pub json: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttemptGradeRequest{
    pub token: String , 
    pub attempt: String , // id
    pub grade: String , // 0 to 4  and empty being not graded yet 
}



#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssigmentAttemptResource{
    pub json: String, 
    pub token: String, 
}

 
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAssigmentRequest {
    pub token: String,
    pub json: String,
    pub label: String,
    pub max_attempts: u32, 
    pub assigment_type: String,
    pub bond: String , 
}



#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListeningAssignment {
    pub id: String,
    #[serde(rename = "type")]
    pub assignment_type: AssignmentType, // = AssignmentType::Listening
    pub grade: Option<String>,
    // pub units: Vec<ListeningUnit>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingAssignment {
    pub id: String,
    #[serde(rename = "type")]
    pub assignment_type: AssignmentType, // = AssignmentType::Writing
    pub grade: Option<String>,
    // pub units: Vec<WritingUnit>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Assignment {
    Speaking(SpeakingAssignment),
    Listening(ListeningAssignment),
    Writing(WritingAssignment),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignmentSession {
    pub id: String,
    pub user: String,
    pub assignment: Assignment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignmentState {
    pub session: AssignmentSession,
    pub unit_index: u32,
    pub answer_state: u32,
    pub timer_current: i64,
    pub timer_started: i64,
    pub time_elapsed: i64,
    pub max_time_per_answer: i64,
    pub max_session_time: i64,
    pub is_recording: bool,
    pub answer_saved: bool,
    pub completed: bool,
    pub label_message: String,
    pub audio_file: String,
    pub is_playing: bool,
    pub is_ticking: bool,
    pub is_listening: bool,
    pub message_note: String,
}

// #[derive(Debug, Serialize, Deserialize)]
// pub struct User {
//     pub id: String,
//     pub name: String,
//     pub last_name: String,
//     pub date_of_birth: String,
//     pub email: String,
//     pub phone: String,
//     pub password_hash: String,
//     pub salt : String  , 
//     pub user_type: String, // "gov", "student", or "police"
//     pub discount_percentage: i32,
//     pub is_active: bool,
//     pub verified: bool,
//     pub created_at: String,
//     pub updated_at: String,
// }


// #[derive(Debug, Serialize, Deserialize)]
// pub struct Wallet {
//     pub id: String,
//     pub user_id: String,
//     pub default_id: String,
//     pub payment_methods: Vec<PaymentMethod>,
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// #[serde(tag = "method_type")]
// pub enum PaymentMethod {
//     #[serde(rename = "card")]
//     Card {
//         id: String,
//         name_on_card: String,
//         card_number: String,
//         card_type:String,
//         cvv: String,
//         expiry_date: String,
//         created_at: String,
//         updated_at: String,
//     },
//     #[serde(rename = "balance")]
//     Balance {
//         id: String,
//         amount: f64,
//         created_at: String,
//         updated_at: String,
//     },
// }


// #[derive(Debug, Serialize, Deserialize)]
// pub struct Transaction {
//     pub id: String,
//     pub user_id: String,
//     pub payment_method: PaymentMethod,  
//     pub amount: f64,
//     pub discount_applied: f64,
//     pub status: String, // "completed"
//     pub trip_id: String,
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Driver {
//     pub id: String,
//     pub name: String,
//     pub email: String,
//     pub phone: String,
//     pub license_number: String,
//     pub license_expiry: String,
//     pub status: String, // "active"
//     pub rating: f64,
//     pub hire_date: String,
//     pub created_at: String,
//     pub updated_at: String,
// }

//     #[derive(Debug, Serialize, Deserialize)]
//     pub struct Bus {
//         pub id: String,
//         pub plate_number: String,
//         pub model: String,
//         pub capacity: i32,
//         pub year: i32,
//         pub maintenance_status: String, // "operational"
//         pub current_latitude: f64,
//         pub current_longitude: f64,
//         pub speed: f64,
//         pub status: String, // "in_service"
//         pub last_updated: String,
//         pub created_at: String,
//         pub updated_at: String,
//     }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct RouteStop {
//     pub id: String,
//     pub route_id: String,
//     pub stop_name: String,
//     pub latitude: f64,
//     pub longitude: f64,
//     pub stop_order: i32,
//     pub is_active: bool,
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct DriverAssignment {
//     pub id: String,
//     pub driver_id: String,
//     pub bus_id: String,
//     pub route_id: String,
//     pub assigned_date: String,
//     pub shift_start: String,
//     pub shift_end: String,
//     pub status: String, // "active"
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Trip {
//     pub id: String,
//     pub bus_id: String,
//     pub route_id: String,
//     pub driver_id: String,
//     pub start_time: String,
//     pub end_time: Option<String>,
//     pub status: String, // "in_progress"
//     pub current_stop_order: i32,
//     pub passenger_count: i32,
//     pub total_revenue: f64,
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct PassengerTrip {
//     pub id: String,
//     pub user_id: String,
//     pub trip_id: String,
//     pub transaction_id: String,
//     pub boarded_at: String,
//     pub exited_at: String,
//     pub status: String, // "in_transit"
//     pub fare_amount: f64,
//     pub discount_applied: f64,
//     pub final_amount: f64,
//     pub created_at: String,
//     pub updated_at: String, 
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct FareHistory {
//     pub id: String,
//     pub route_id: String,
//     pub base_fare: f64,
//     pub effective_date: String,
//     pub end_date: Option<String>,
//     pub reason: String,
//     pub modified_by: String,
//     pub created_at: String,
//     pub updated_at: String,
// }













// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserInfo {
//     pub id: String,
//     pub name: String,
//     pub last_name: String,
//     pub date_of_birth: String,
//     pub email: String,
//     pub phone: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Card {
//     pub id: String,
//     pub name_on_card: String,
//     pub card_number: String,
//     pub expiry_date: String,
//     pub cvv: String,
//     pub card_type: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct TripHistory {
//     pub id: String,
//     pub route_name: String,
//     pub driver: String,
//     pub drop_off_point: String,
//     pub price: f64,
//     pub payment_method: Card,
//     pub date: String,
//     pub status: String,
// }

// #[derive(Debug, Serialize, Deserialize,Clone)]
// pub struct NotificationSettings {
//     pub trip_updates: bool,
//     pub price_changes: bool,
//     pub security_alerts: bool,
//     pub promotions: bool,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserSettings {
//     pub id: String, 
//     pub notifications: NotificationSettings,
//     pub language: String,
//     pub created_at: String,
//     pub updated_at: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserSession {
//     pub user: UserInfo,
//     pub cards: Vec<Card>,
//     pub history: Vec<TripHistory>,
//     pub settings: UserSettings,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserSessionRequest {
//     pub user_id: String,
// }