import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['MCQ', 'SHORT', 'LONG', 'NUMERICAL'],
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 0.5,
  },
  options: [{
    type: String // Only for MCQ
  }]
});

const questionPaperSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: false, // Can be linked later
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1,
  },
  mode: {
    type: String,
    enum: ['MANUAL', 'LLM'],
    default: 'MANUAL',
  },
  questions: [questionSchema],
  isPublished: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Pre-save validation: Ensure totalMarks equals sum of question marks
questionPaperSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    const sum = this.questions.reduce((acc, q) => acc + q.marks, 0);
    if (sum !== this.totalMarks) {
      const epsilon = 0.001;
      if (Math.abs(sum - this.totalMarks) > epsilon) {
        const error = new Error(`Total marks (${this.totalMarks}) must equal sum of question marks (${sum})`);
        return next(error);
      }
    }
  }
  next();
});

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);
export default QuestionPaper;
