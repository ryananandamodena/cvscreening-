// Maps a backend error slug (the `error` field on ErrorResponse, surfaced by api.ts's request()
// helper as the thrown Error's message) to a message a non-technical employee can act on.
// Anything not recognized falls back to a generic retry message — the raw backend
// error/details must never reach the UI.
export function friendlyErrorMessage(err: any): string {
  const slug = err?.message || '';
  switch (slug) {
    case 'survey_not_found':
      return 'Survey ini tidak ditemukan atau sudah dihapus.';
    case 'survey_inactive':
      return 'Survey ini sedang tidak menerima jawaban.';
    case 'survey_not_started':
      return 'Survey ini belum dibuka.';
    case 'survey_expired':
      return 'Survey ini sudah ditutup.';
    case 'duplicate_submission':
      return 'Anda sudah mengisi survey ini sebelumnya.';
    case 'required_question_unanswered':
      return 'Mohon lengkapi semua pertanyaan wajib sebelum mengirim.';
    case 'invalid_answer':
      return 'Salah satu jawaban tidak valid. Silakan periksa kembali.';
    case 'no_employee_record':
      return 'Akun Anda belum terhubung dengan data karyawan. Hubungi HR.';
    case 'UNAUTHORIZED':
      return 'Sesi Anda telah berakhir. Silakan login kembali.';
    default:
      return 'Survey belum dapat dikirim. Silakan coba lagi.';
  }
}
