use axum::{response::IntoResponse, Json};
use mongodb::bson::doc;

use crate::components::dbfactory::db;
use crate::components::sessions;
use crate::identity::identities::{
    AssigmentAttempt, AttemptGradeRequest, Session, Teacher, UserInfo,
};

pub async fn grade_attempt(
    Json(body): Json<AttemptGradeRequest>,
) -> impl IntoResponse {
    println!("════════════════════════════════════════════════════════════");
    println!("[GRADE_ATTEMPT] ── INCOMING REQUEST ──────────────────────");
    println!("[GRADE_ATTEMPT] token (first 8) = {:?}", &body.token.chars().take(8).collect::<String>());
    println!("[GRADE_ATTEMPT] attempt id     = {:?}", body.attempt);
    println!("[GRADE_ATTEMPT] grade          = {:?}", body.grade);

    // ── 1) SESSION EXISTS ────────────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 1 ── looking up session");
    let session: Session = match sessions::get_by_token(&body.token) {
        Some(s) => {
            println!("[GRADE_ATTEMPT] STEP 1 ✅ session found for user = {:?}", s.user);
            s
        }
        None => {
            println!("[GRADE_ATTEMPT] STEP 1 ❌ no session for that token");
            return "FAIL:Invalid session".to_string();
        }
    };

    // ── 2) SESSION NOT EXPIRED ───────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 2 ── checking expiry");
    let now = chrono::Utc::now();
    let ends_at = match chrono::DateTime::parse_from_rfc3339(&session.ends_at) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(e) => {
            println!("[GRADE_ATTEMPT] STEP 2 ❌ parse error: {}", e);
            return "FAIL:Invalid session format".to_string();
        }
    };
    if now >= ends_at {
        println!("[GRADE_ATTEMPT] STEP 2 ❌ session expired");
        return "FAIL:Session expired".to_string();
    }
    println!("[GRADE_ATTEMPT] STEP 2 ✅ session not expired");

    // ── 3) MUST BE A TEACHER ────────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 3 ── verifying teacher");
    let teacher: Teacher = match db()
        .teachers()
        .find_one(doc! { "id": &session.user })
        .await
    {
        Ok(Some(t)) => {
            println!("[GRADE_ATTEMPT] STEP 3 ✅ teacher = {:?}", t.name);
            t
        }
        Ok(None) => {
            println!("[GRADE_ATTEMPT] STEP 3 ❌ caller is not a teacher");
            return "FAIL:Only teachers can grade attempts".to_string();
        }
        Err(e) => {
            println!("[GRADE_ATTEMPT] STEP 3 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 4) VALIDATE GRADE ───────────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 4 ── validating grade");
    let grade = body.grade.trim();
    if !grade.is_empty() {
        match grade.parse::<u32>() {
            Ok(n) if n <= 4 => {
                println!("[GRADE_ATTEMPT] STEP 4 ✅ grade = {}", n);
            }
            _ => {
                println!(
                    "[GRADE_ATTEMPT] STEP 4 ❌ grade {:?} is not 0-4 or empty",
                    grade
                );
                return "FAIL:Grade must be 0-4 or empty".to_string();
            }
        }
    } else {
        println!("[GRADE_ATTEMPT] STEP 4 ✅ grade cleared (ungraded)");
    }

    // ── 5) FIND THE ATTEMPT ─────────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 5 ── looking up attempt = {:?}", body.attempt);
    let attempt: AssigmentAttempt = match db()
        .attempts()
        .find_one(doc! { "id": &body.attempt })
        .await
    {
        Ok(Some(a)) => {
            println!(
                "[GRADE_ATTEMPT] STEP 5 ✅ attempt found (user = {:?}, assigment = {:?})",
                a.user, a.assigment_id
            );
            a
        }
        Ok(None) => {
            println!("[GRADE_ATTEMPT] STEP 5 ❌ no attempt with id = {:?}", body.attempt);
            return "FAIL:Attempt not found".to_string();
        }
        Err(e) => {
            println!("[GRADE_ATTEMPT] STEP 5 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    // ── 6) VERIFY OWNERSHIP VIA THE STUDENT ─────────────────────────
    // The teacher may have already wiped the assignment (update_assigment
    // replaces it wholesale). We cannot rely on raw_assigments still
    // containing the id the attempt points at. Instead, verify that the
    // attempt's student belongs to this teacher — that's the durable
    // relationship. If student.teacher == teacher.id, the attempt was
    // made under this teacher's authority, period.
    println!(
        "[GRADE_ATTEMPT] STEP 6 ── verifying attempt's student belongs to teacher = {:?}",
        teacher.id
    );
    let student: UserInfo = match db()
        .users()
        .find_one(doc! { "id": &attempt.user })
        .await
    {
        Ok(Some(s)) => s,
        Ok(None) => {
            println!(
                "[GRADE_ATTEMPT] STEP 6 ❌ attempt's user {:?} not found",
                attempt.user
            );
            return "FAIL:Student not found".to_string();
        }
        Err(e) => {
            println!("[GRADE_ATTEMPT] STEP 6 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    };

    if student.teacher != teacher.id {
        // Fall back to a name comparison for older docs that stored the
        // teacher's name instead of their id.
        let matches_by_name = student.teacher == teacher.name;
        if !matches_by_name {
            println!(
                "[GRADE_ATTEMPT] STEP 6 ❌ student {:?} belongs to {:?}, not to teacher {:?}",
                student.id, student.teacher, teacher.id
            );
            return "FAIL:Not authorized to grade this attempt".to_string();
        }
        println!("[GRADE_ATTEMPT] STEP 6 ✅ ownership matched by teacher name (legacy doc)");
    } else {
        println!("[GRADE_ATTEMPT] STEP 6 ✅ student belongs to this teacher");
    }

    // ── 7) WRITE THE GRADE ──────────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 7 ── writing grade = {:?}", grade);
    match db()
        .attempts()
        .update_one(
            doc! { "id": &attempt.id },
            doc! { "$set": { "grade": grade } },
        )
        .await
    {
        Ok(res) if res.matched_count > 0 => {
            println!(
                "[GRADE_ATTEMPT] STEP 7 ✅ grade written ({} bytes)",
                grade.len()
            );
        }
        Ok(_) => {
            println!("[GRADE_ATTEMPT] STEP 7 ❌ attempt vanished mid-update");
            return "FAIL:Attempt not found".to_string();
        }
        Err(e) => {
            println!("[GRADE_ATTEMPT] STEP 7 ❌ DB error: {}", e);
            return "FAIL:Database error".to_string();
        }
    }

    // ── 8) RETURN ───────────────────────────────────────────────────
    println!("[GRADE_ATTEMPT] STEP 8 ✅ ── DONE ──");
    println!("════════════════════════════════════════════════════════════");
    "OK:Grade updated".to_string()
}