import { friendlyErrorMessage } from '../../../utils/surveyErrors';

// Component-rendering tests (question types, answer selection, submit flow) for
// employee-survey.tsx itself need a React Native component-test setup (jest-expo /
// @testing-library/react-native) that this project's jest config doesn't have yet — see the
// audit report for that gap. This covers the pure, extracted error-mapping logic instead.
describe('friendlyErrorMessage', () => {
  it('maps known backend error slugs to Indonesian, user-actionable messages', () => {
    expect(friendlyErrorMessage({ message: 'survey_inactive' })).toBe('Survey ini sedang tidak menerima jawaban.');
    expect(friendlyErrorMessage({ message: 'duplicate_submission' })).toBe('Anda sudah mengisi survey ini sebelumnya.');
    expect(friendlyErrorMessage({ message: 'required_question_unanswered' })).toBe(
      'Mohon lengkapi semua pertanyaan wajib sebelum mengirim.'
    );
  });

  it('never leaks the raw backend error for unknown slugs', () => {
    const msg = friendlyErrorMessage({ message: 'some_internal_sql_error: relation does not exist' });
    expect(msg).toBe('Survey belum dapat dikirim. Silakan coba lagi.');
    expect(msg).not.toContain('sql');
    expect(msg).not.toContain('relation');
  });

  it('falls back gracefully when no message is present at all', () => {
    expect(friendlyErrorMessage({})).toBe('Survey belum dapat dikirim. Silakan coba lagi.');
    expect(friendlyErrorMessage(undefined)).toBe('Survey belum dapat dikirim. Silakan coba lagi.');
  });
});
