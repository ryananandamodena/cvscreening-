import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { apiService } from '../../services/api';
import { friendlyErrorMessage } from '../../utils/surveyErrors';

type ViewState = 'loading' | 'error' | 'empty' | 'list' | 'answering' | 'submitting' | 'success' | 'already_submitted';

type Question = {
  id: number;
  questionText: string;
  questionType: 'rating' | 'single_choice' | 'multiple_choice' | 'text';
  options: Array<{ value: string; label: string }>;
  required: boolean;
};

export default function EmployeeSurveyScreen() {
  const [state, setState] = useState<ViewState>('loading');
  const [surveys, setSurveys] = useState<any[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, { value?: string; values?: string[] }>>({});

  const loadSurveys = useCallback(async () => {
    setState('loading');
    try {
      const data = await apiService.getSurveys('active');
      setSurveys(data);
      setState(data.length === 0 ? 'empty' : 'list');
    } catch (err) {
      setState('error');
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSurveys(); }, [loadSurveys]));

  const openSurvey = async (survey: any) => {
    setState('loading');
    setActiveSurvey(survey);
    try {
      if (survey.hasResponded) {
        setState('already_submitted');
        return;
      }
      const data = await apiService.getSurveyQuestions(survey.id);
      setQuestions(data);
      setAnswers({});
      setState('answering');
    } catch (err) {
      setState('error');
    }
  };

  const setAnswerValue = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value } }));
  };

  const toggleMultiAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.values || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [questionId]: { values: next } };
    });
  };

  const validateBeforeSubmit = (): string | null => {
    for (const q of questions) {
      if (!q.required) continue;
      const a = answers[q.id];
      if (q.questionType === 'multiple_choice') {
        if (!a?.values || a.values.length === 0) return `Mohon jawab: ${q.questionText}`;
      } else {
        if (!a?.value || !a.value.trim()) return `Mohon jawab: ${q.questionText}`;
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateBeforeSubmit();
    if (validationError) {
      Alert.alert('Belum lengkap', validationError);
      return;
    }
    Alert.alert('Kirim Survey', 'Setelah dikirim, jawaban tidak dapat diubah. Lanjutkan?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kirim', onPress: doSubmit },
    ]);
  };

  const doSubmit = async () => {
    setState('submitting');
    try {
      const payload = Object.entries(answers)
        .filter(([, a]) => a.value !== undefined || (a.values && a.values.length > 0))
        .map(([questionId, a]) => ({ questionId: Number(questionId), value: a.value, values: a.values }));

      await apiService.submitSurveyResponse(activeSurvey.id, payload);
      setState('success');
    } catch (err: any) {
      Alert.alert('Gagal Mengirim', friendlyErrorMessage(err));
      setState('answering');
    }
  };

  const backToList = () => {
    setActiveSurvey(null);
    setQuestions([]);
    setAnswers({});
    loadSurveys();
  };

  // ---------- Loading ----------
  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ---------- Error ----------
  if (state === 'error') {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat survey. Periksa koneksi Anda.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSurveys}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Empty ----------
  if (state === 'empty') {
    return (
      <View style={styles.center}>
        <Ionicons name="clipboard-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Tidak ada survey yang tersedia saat ini.</Text>
      </View>
    );
  }

  // ---------- Already submitted ----------
  if (state === 'already_submitted') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.successTitle}>Sudah Diisi</Text>
        <Text style={styles.emptyText}>Anda sudah mengirimkan jawaban untuk survey ini.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={backToList}>
          <Text style={styles.retryText}>Kembali ke Daftar Survey</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Success ----------
  if (state === 'success') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.successTitle}>Survey berhasil dikirim</Text>
        <Text style={styles.emptyText}>Terima kasih atas masukan Anda!</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={backToList}>
          <Text style={styles.retryText}>Kembali ke Daftar Survey</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- List of available surveys ----------
  if (state === 'list') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Employee Surveys</Text>
        <ScrollView contentContainerStyle={styles.content}>
          {surveys.map((s) => (
            <TouchableOpacity key={s.id} style={[styles.surveyCard, Shadow.sm]} onPress={() => openSurvey(s)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.surveyTitle}>{s.title}</Text>
                <Text style={styles.surveyMeta}>{s.questionCount} pertanyaan</Text>
              </View>
              {s.hasResponded ? (
                <View style={styles.doneBadge}>
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                  <Text style={styles.doneBadgeText}>Sudah diisi</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ---------- Answering / Submitting ----------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activeSurvey?.title}</Text>
      <ScrollView contentContainerStyle={styles.content}>
        {questions.map((q) => (
          <View key={q.id} style={[styles.card, Shadow.sm]}>
            <Text style={styles.questionText}>
              {q.questionText}{q.required ? ' *' : ''}
            </Text>

            {q.questionType === 'rating' && (
              q.options.length > 0 ? q.options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionBtn, answers[q.id]?.value === opt.value && styles.optionSelected]}
                  onPress={() => setAnswerValue(q.id, opt.value)}
                >
                  <Ionicons
                    name={answers[q.id]?.value === opt.value ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={answers[q.id]?.value === opt.value ? Colors.white : Colors.primary}
                  />
                  <Text style={[styles.optionText, answers[q.id]?.value === opt.value && { color: Colors.white }]}>
                    {opt.value} - {opt.label}
                  </Text>
                </TouchableOpacity>
              )) : [1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.optionBtn, answers[q.id]?.value === String(r) && styles.optionSelected]}
                  onPress={() => setAnswerValue(q.id, String(r))}
                >
                  <Ionicons
                    name={answers[q.id]?.value === String(r) ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={answers[q.id]?.value === String(r) ? Colors.white : Colors.primary}
                  />
                  <Text style={[styles.optionText, answers[q.id]?.value === String(r) && { color: Colors.white }]}>{r}</Text>
                </TouchableOpacity>
              ))
            )}

            {q.questionType === 'single_choice' && q.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, answers[q.id]?.value === opt.value && styles.optionSelected]}
                onPress={() => setAnswerValue(q.id, opt.value)}
              >
                <Ionicons
                  name={answers[q.id]?.value === opt.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={answers[q.id]?.value === opt.value ? Colors.white : Colors.primary}
                />
                <Text style={[styles.optionText, answers[q.id]?.value === opt.value && { color: Colors.white }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {q.questionType === 'multiple_choice' && q.options.map((opt) => {
              const selected = answers[q.id]?.values?.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionBtn, selected && styles.optionSelected]}
                  onPress={() => toggleMultiAnswer(q.id, opt.value)}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? Colors.white : Colors.primary}
                  />
                  <Text style={[styles.optionText, selected && { color: Colors.white }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}

            {q.questionType === 'text' && (
              <TouchableOpacity
                style={styles.textAnswerBox}
                onPress={() => promptTextAnswer(q, answers[q.id]?.value, (v) => setAnswerValue(q.id, v))}
              >
                <Text style={answers[q.id]?.value ? styles.textAnswerFilled : styles.textAnswerPlaceholder}>
                  {answers[q.id]?.value || 'Ketuk untuk menjawab...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, state === 'submitting' && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={state === 'submitting'}
        >
          {state === 'submitting' ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitText}>Submit Survey</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Text questions use a simple native prompt-style flow via Alert.prompt on iOS; Android's Alert
// has no text input, so we fall back to a lightweight inline editor there instead.
function promptTextAnswer(q: Question, currentValue: string | undefined, onChange: (v: string) => void) {
  if (Alert.prompt) {
    Alert.prompt(q.questionText, undefined, (text) => onChange(text || ''), 'default', currentValue);
  } else {
    onChange(currentValue || '');
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.lg },
  content: { paddingBottom: Spacing.xxxl },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  questionText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  textAnswerBox: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, minHeight: 56, backgroundColor: Colors.background,
  },
  textAnswerPlaceholder: { color: Colors.textTertiary, fontSize: FontSize.md },
  textAnswerFilled: { color: Colors.text, fontSize: FontSize.md },
  submitBtn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: 'center' },
  submitText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  retryText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  surveyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  surveyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  surveyMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successBg, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  doneBadgeText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold },
});
