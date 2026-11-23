use serde::Deserialize;
use spk_engine::{calculate_all, Alternative, Criterion};
use std::io::{self, Read};

#[derive(Deserialize)]
struct EngineRequest {
    alternatives: Vec<Alternative>,
    criteria: Vec<Criterion>,
}

fn main() {
    let mut raw_input = String::new();
    if let Err(err) = io::stdin().read_to_string(&mut raw_input) {
        eprintln!("Gagal membaca stdin: {err}");
        std::process::exit(1);
    }

    let req: EngineRequest = match serde_json::from_str(&raw_input) {
        Ok(parsed) => parsed,
        Err(err) => {
            eprintln!("Format JSON tidak valid: {err}");
            std::process::exit(1);
        }
    };

    match calculate_all(&req.alternatives, &req.criteria) {
        Ok(result) => match serde_json::to_string(&result) {
            Ok(out) => println!("{out}"),
            Err(err) => {
                eprintln!("Gagal serialisasi JSON output: {err}");
                std::process::exit(1);
            }
        },
        Err(err) => {
            eprintln!("{err}");
            std::process::exit(1);
        }
    }
}

