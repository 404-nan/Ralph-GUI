use std::{
    fs,
    io,
    path::{Path, PathBuf},
    process::ExitCode,
};

use clap::{CommandFactory, Parser};

#[derive(Debug, Clone, PartialEq, Eq)]
struct TextStats {
    lines: usize,
    words: usize,
    bytes: usize,
}

#[derive(Parser, Debug)]
#[command(
    name = "mini-wc-cli",
    version,
    about = "Count lines, words, and bytes in a file"
)]
struct Cli {
    #[arg(value_name = "FILE", help = "Path to the file to inspect")]
    path: Option<PathBuf>,
}

fn main() -> ExitCode {
    match run() {
        Ok(Some(report)) => {
            println!("{report}");
            ExitCode::SUCCESS
        }
        Ok(None) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("Error: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<Option<String>, String> {
    let cli = Cli::parse();
    let Some(path) = cli.path else {
        print_help().map_err(|error| format!("failed to print help: {error}"))?;
        return Ok(None);
    };

    let stats = count_file(&path)?;
    Ok(Some(format_report(&path, &stats)))
}

fn print_help() -> io::Result<()> {
    let mut command = Cli::command();
    command.print_help()?;
    println!();
    Ok(())
}

fn count_file(path: &Path) -> Result<TextStats, String> {
    let bytes = fs::read(path).map_err(|error| format!("failed to read {}: {error}", path.display()))?;
    Ok(count_bytes(&bytes))
}

fn count_bytes(bytes: &[u8]) -> TextStats {
    let text = String::from_utf8_lossy(bytes);

    TextStats {
        lines: text.lines().count(),
        words: text.split_whitespace().count(),
        bytes: bytes.len(),
    }
}

fn format_report(path: &Path, stats: &TextStats) -> String {
    format!(
        "File: {}\nLines: {}\nWords: {}\nBytes: {}",
        path.display(),
        stats.lines,
        stats.words,
        stats.bytes
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_lines_words_and_bytes() {
        let stats = count_bytes(b"hello world\nsecond line\n");

        assert_eq!(
            stats,
            TextStats {
                lines: 2,
                words: 4,
                bytes: 24,
            }
        );
    }

    #[test]
    fn counts_empty_input() {
        let stats = count_bytes(b"");

        assert_eq!(
            stats,
            TextStats {
                lines: 0,
                words: 0,
                bytes: 0,
            }
        );
    }

    #[test]
    fn formats_readable_report() {
        let stats = TextStats {
            lines: 10,
            words: 20,
            bytes: 120,
        };

        assert_eq!(
            format_report(Path::new("sample.txt"), &stats),
            "File: sample.txt\nLines: 10\nWords: 20\nBytes: 120"
        );
    }

    #[test]
    fn help_mentions_usage_and_file_argument() {
        let mut command = Cli::command();
        let mut help = Vec::new();

        command.write_long_help(&mut help).expect("help should render");

        let rendered = String::from_utf8(help).expect("help should be utf8");
        assert!(rendered.contains("Usage:"));
        assert!(rendered.contains("FILE"));
    }
}
