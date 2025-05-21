import mongoose, { Document, Schema, Types } from 'mongoose';
import { IFormSubmission } from '../types/form';

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    form: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    data: { type: Schema.Types.Mixed, required: true },
    submittedBy: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const FormSubmission = mongoose.model<IFormSubmission>(
  'FormSubmission',
  FormSubmissionSchema
);
export default FormSubmission;
