export type RootStackParamList = {
  LoginMethodSelection: undefined;
  Login: undefined;
  UsernameOTPLogin: undefined;
  SetPassword: {
    username: string;
  };
  ForgotPassword: undefined;
  ResetPassword: {
    username: string;
    mobileMasked: string;
  };
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
  Home: {
    userFullName?: string;
    userId?: string;
    role?: string;
  };
  Visitors: undefined;
  VisitorDetails: {
    request: any; // Full pass request object
    visitor: any; // Visitor object from the request
  };
  IssueVisitorPass: {
    userFullName?: string;
    userId?: string;
  };
  PreviewPass: {
    passData: any; // Full API response from /api/v1/pass-requests/{request_id}
    categoryName?: string; // Category name
    passTypeName?: string; // Pass type name
  };
};
