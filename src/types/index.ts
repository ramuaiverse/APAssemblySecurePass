export type RootStackParamList = {
  Login: undefined;
  PreCheck: undefined;
  QRScan: {
    mode?: "gateEntryExit" | "verifyVisitor";
  };
  ValidPass: {
    validationResponse: {
      valid: boolean;
      suspended: boolean;
      expired: boolean;
      not_yet_valid: boolean;
      visitor: {
        id: string;
        first_name: string;
        last_name: string;
        name: string;
        email: string;
        phone: string;
        identification_type: string | null;
        identification_number: string | null;
        identification_photo_url: string | null;
        photo: string | null;
      } | null;
      pass: {
        request_id: string;
        pass_number: string;
        pass_qr_string: string;
        pass_qr_code: string;
        session: string;
        category: string;
        pass_category: string;
        pass_sub_category: string;
        pass_type: string;
        valid_from: string;
        valid_to: string;
        valid_from_formatted: string;
        valid_to_formatted: string;
        purpose: string;
        requested_by: string;
      } | null;
      status: string;
      scan_recorded: boolean;
      scan_id: string | null;
      message?: string;
      visitorPhoto?: string | null;
    };
  };
  InvalidPass: {
    validationResponse?: {
      valid: boolean;
      suspended: boolean;
      expired: boolean;
      not_yet_valid: boolean;
      visitor: {
        id: string;
        first_name: string;
        last_name: string;
        name: string;
        email: string;
        phone: string;
        identification_type: string | null;
        identification_number: string | null;
        identification_photo_url: string | null;
        photo: string | null;
      } | null;
      pass: {
        request_id: string;
        pass_number: string;
        pass_qr_string: string;
        pass_qr_code: string;
        session: string;
        category: string;
        pass_category: string;
        pass_sub_category: string;
        pass_type: string;
        valid_from: string;
        valid_to: string;
        valid_from_formatted: string;
        valid_to_formatted: string;
        purpose: string;
        requested_by: string;
      } | null;
      status: string;
      scan_recorded: boolean;
      scan_id: string | null;
      message?: string;
    };
  };
  IssueVisitorPass: undefined;
  PreviewPass: {
    passData: {
      id: string;
      qr_code_id: string;
      qr_code_url: string;
      full_name: string;
      email: string | null;
      phone: string;
      organization: string | null;
      number_of_visitors: number;
      purpose_of_visit: string;
      pass_type: string;
      entry_type: string;
      valid_from: string;
      valid_until: string;
      status: string;
      designation: string | null;
      identification_type: string | null;
      identification_number: string | null;
      created_by: string | null;
      requested_by: string | null;
      session_category: string | null;
      notes: string | null;
      created_at: string;
    };
  };
};
