// server/models/Form.ts
import mongoose, { Schema, Document } from 'mongoose';

// Logo interface
export interface ILogo {
  src: string;
  type: 'uploaded' | 'url';
  publicId?: string; // Cloudinary public ID for uploaded images
  alignment: 'LEFT' | 'CENTER' | 'RIGHT';
  size: number;
}

// Form interface
export interface IForm extends Document {
  title: string;
  description?: string;
  logo?: ILogo;
  fields: any[]; // This would be more specific in your actual app
  userId: mongoose.Types.ObjectId;
  isPublished: boolean;
  settings: {
    theme: string;
    showLogo: boolean;
    [key: string]: any; // Allow for additional settings
  };
  createdAt: Date;
  updatedAt: Date;
}

// Logo schema
const LogoSchema = new Schema<ILogo>({
  src: { type: String, required: true },
  type: { type: String, enum: ['uploaded', 'url'], required: true },
  publicId: { type: String }, // Only for Cloudinary uploads
  alignment: {
    type: String,
    enum: ['LEFT', 'CENTER', 'RIGHT'],
    default: 'CENTER',
  },
  size: { type: Number, default: 50, min: 10, max: 100 },
});

// Form schema
const FormSchema = new Schema<IForm>(
  {
    title: { type: String, required: true, default: 'Untitled Form' },
    description: { type: String },
    logo: { type: LogoSchema },
    fields: { type: [Schema.Types.Mixed], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false },
    settings: {
      theme: { type: String, default: 'default' },
      showLogo: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Create and export the model
const Form = mongoose.model<IForm>('Form', FormSchema);
export default Form;
