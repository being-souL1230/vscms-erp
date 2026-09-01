import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { formatDate, getDueStatus } from '../../core/utils/helpers';
import { transformAssignmentDetail } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function AssignmentDetailScreen({ route, navigation }) {
  const { assignmentId } = route.params;
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');

  const fetchAssignment = async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.ASSIGNMENTS.LIST);
      const found = transformAssignmentDetail(response.data, assignmentId);
      setAssignment(found);
    } catch (err) {
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(API_ENDPOINTS.ASSIGNMENTS.LIST, {
                type: 'submission',
                assignmentId: Number(assignmentId),
                submissionText: submissionText || 'Submitted through mobile app.',
              });
              Alert.alert('Success', 'Assignment submitted successfully');
              fetchAssignment();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to submit');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchAssignment} />;
  if (!assignment) return <ErrorState message="Assignment not found" />;

  const dueStatus = getDueStatus(assignment.due_date);
  const isSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Badge label={assignment.subject?.name} variant="primary" size="lg" />
        <Text style={styles.title}>{assignment.title}</Text>
        <Badge label={assignment.status} variant={isSubmitted ? 'success' : dueStatus === 'overdue' ? 'danger' : 'warning'} size="lg" />
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Faculty:</Text>
          <Text style={styles.infoValue}>{assignment.facultyName || assignment.faculty_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Due Date:</Text>
          <Text style={[styles.infoValue, dueStatus === 'overdue' && { color: COLORS.error }]}>
            {formatDate(assignment.due_date)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="star-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Max Marks:</Text>
          <Text style={styles.infoValue}>{assignment.maxMarks || assignment.max_marks || '-'}</Text>
        </View>
      </Card>

      <Card style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{assignment.description}</Text>
      </Card>

      {!isSubmitted && (
        <>
          <Card style={styles.submissionCard}>
            <Text style={styles.sectionTitle}>Your Submission</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type your submission text here..."
              placeholderTextColor={COLORS.disabled}
              value={submissionText}
              onChangeText={setSubmissionText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>
          <Button
            title="Submit Assignment"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.submitButton}
          />
        </>
      )}

      {isSubmitted && assignment.submission && (
        <Card style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Submission Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Badge label={assignment.submission.status} variant="success" />
          </View>
          {assignment.submission.marks && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Marks:</Text>
              <Text style={styles.infoValue}>{assignment.submission.marks}</Text>
            </View>
          )}
          {assignment.submission.feedback && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Feedback:</Text>
              <Text style={styles.infoValue}>{assignment.submission.feedback}</Text>
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  backText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: SPACING.md,
    lineHeight: 34,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  descriptionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  submissionCard: {
    marginTop: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
});
