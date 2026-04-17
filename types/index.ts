export type { Application, TimeSlot, CandidateProfile, CandidateTag, AdminUser } from "@prisma/client";

export type ApplicationStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED";

export type SlotGroup = {
  date: string; // YYYY-MM-DD
  slots: {
    id: number;
    startsAt: string;
    durationMin: number;
  }[];
};

export type ApplicationWithSlot = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  grade: string;
  resumeUrl: string | null;
  industries: string[];
  expectedSalary: string | null;
  painPoints: string;
  workFormats: string[];
  willingToRelocate: boolean;
  relocateTo: string | null;
  strengths: string;
  weaknesses: string;
  status: ApplicationStatus;
  paymentLink: string | null;
  adminNotes: string | null;
  createdAt: string;
  slot: {
    id: number;
    startsAt: string;
    durationMin: number;
  };
};
