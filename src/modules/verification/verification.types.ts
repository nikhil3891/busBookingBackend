import { Schema, Types } from 'mongoose';

export enum VerificationStatus {
  PENDING = 'pending', // submitted, not yet assigned to a manager
  ASSIGNED = 'assigned', // a manager has been assigned, review not started
  IN_REVIEW = 'in_review', // manager is actively reviewing docs / inspection
  ACTIVE = 'active', // approved — bookable / operational
  REJECTED = 'rejected', // verification failed; can be resubmitted
  SUSPENDED = 'suspended', // was active, temporarily disabled
  INACTIVE = 'inactive', // deliberately deactivated (not a rejection)
}

export interface IVerificationDocument {
  type: string; // e.g. 'rc', 'permit', 'insurance', 'driving_license', 'aadhar'
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: Date;
}

export interface IVerification {
  status: VerificationStatus;
  assignedManagerId?: Types.ObjectId;
  assignedBy?: Types.ObjectId; // admin/super_admin who made the assignment
  submittedAt: Date;
  assignedAt?: Date;
  dueAt?: Date; // submittedAt + SLA window — dashboards flag anything past this
  decidedAt?: Date;
  decidedBy?: Types.ObjectId;
  documents: IVerificationDocument[];
  inspectionNotes?: string;
  inspectedAt?: Date;
  decisionReason?: string; // required when rejecting/suspending
}

const verificationDocumentSchema = new Schema<IVerificationDocument>(
  {
    type: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const verificationSchema = new Schema<IVerification>(
  {
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    assignedManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    assignedAt: Date,
    dueAt: Date,
    decidedAt: Date,
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    documents: { type: [verificationDocumentSchema], default: [] },
    inspectionNotes: String,
    inspectedAt: Date,
    decisionReason: String,
  },
  { _id: false },
);
