// Simple In-Memory Queue for MVP
// Utilizes checks from CostGuard and calls ValidationService

import { validateWithLLM } from './answerValidation.service.js';
import { checkLlmQuota, incrementLlmUsage } from './llmCostGuard.service.js';
import AttendanceSubmission from '../models/AttendanceSubmission.js';

class LlmQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.concurrency = 3; // Process 3 jobs at a time
        this.activeJobs = 0;
    }

    enqueue(submissionId, question, answer, sessionId) {
        this.queue.push({ submissionId, question, answer, sessionId });
        this.processNext();
    }

    async processNext() {
        if (this.queue.length === 0 || this.activeJobs >= this.concurrency) {
            return;
        }

        const job = this.queue.shift();
        this.activeJobs++;

        try {
            await this.runJob(job);
        } catch (error) {
            console.error(`Queue Job Failed for ${job.submissionId}:`, error);
            // Optionally mark submission as 'Failed' or retry
            await AttendanceSubmission.findByIdAndUpdate(job.submissionId, {
                status: 'Failed'
            });
        } finally {
            this.activeJobs--;
            this.processNext();
        }
    }

    async runJob({ submissionId, question, answer, sessionId }) {
        console.log(`[Queue] Starting Job for Submission: ${submissionId}`);
        // 1. Cost Guard Check
        const canRun = await checkLlmQuota(sessionId);
        if (!canRun) {
            console.log(`[Queue] Quota Exceeded for Session: ${sessionId}`);
            // Fallback: If quota exceeded, maybe mark Manual review or Rejected?
            // For MVP, if we promised Queue, we should try. If limit hit, we reject.
            await AttendanceSubmission.findByIdAndUpdate(submissionId, {
                status: 'Rejected', // Or 'Pending' for manual review
                verificationMethod: 'Manual' // Flag for teacher
            });
            return;
        }

        // 2. Run LLM
        await incrementLlmUsage(sessionId);
        const result = await validateWithLLM(question, answer);
        console.log(`[Queue] LLM Result for ${submissionId}:`, result);
        
        // 3. Update Submission using the service logic
        await AttendanceSubmission.findByIdAndUpdate(submissionId, {
            status: result.isValid ? 'Approved' : 'Rejected',
            verificationMethod: 'LLM',
            confidenceScore: result.confidence,
            processedAt: new Date()
        });

        // 4. IF Approved: Mark Attendance
        if (result.isValid) {
            try {
                console.log(`[Queue] Attempting to mark attendance for ${submissionId}...`);
                const module = await import('./answerValidation.service.js');
                if (!module || !module.markAttendanceAfterValidation) {
                     console.error("[Queue] CRITICAL: Dynamic import failed or function missing!");
                     return;
                }
                await module.markAttendanceAfterValidation(submissionId);
                console.log(`[Queue] markAttendanceAfterValidation returned for ${submissionId}`);
            } catch (err) {
                console.error(`[Queue] ERROR marking attendance for ${submissionId}:`, err);
            }
        } else {
             console.log(`[Queue] Submission rejected, skipping attendance write.`);
        }
    }
}

export const llmQueue = new LlmQueue();
