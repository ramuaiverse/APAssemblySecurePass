export type RootStackParamList = {
  Login: undefined;
  QRScan: undefined;
  ValidPass: {
    validationResponse: {
      valid: boolean;
      status: string;
      message: string;
      scan_id: string | null;
      pass_data: {
        id: string;
        qr_code_id: string;
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
        notes: string | null;
        created_at: string;
      } | null;
    };
  };
  InvalidPass: undefined;
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
      notes: string | null;
      created_at: string;
    };
  };
};
