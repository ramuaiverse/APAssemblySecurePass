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
    hod_approver?: boolean;
    sub_categories?: Array<any>;
  };
  Visitors: {
    role?: string;
    userId?: string;
    hod_approver?: boolean;
    sub_categories?: Array<any>;
  };
  StatusAndApprovals: {
    userId?: string;
    hod_approver?: boolean;
    sub_categories?: Array<any>;
    username?: string;
    userFullName?: string;
    role?: string;
  };
  VisitorDetails: {
    request: any; // Full pass request object
    visitor: any; // Visitor object from the request
    role?: string;
  };
  IssueVisitorPass: {
    userFullName?: string;
    userId?: string;
  };
  PreviewPass: {
    passData: any; // Full API response from /api/v1/pass-requests/{request_id}
    categoryName?: string; // Category name
    passTypeName?: string; // Pass type name
    returnTo?: string; // Screen to navigate back to (e.g., "Visitors")
    returnToParams?: any; // Params for the return screen
  };
  MyPassRequests: {
    userId?: string;
    userFullName?: string;
    sub_categories?: Array<any>;
  };
  RequestVisitorPass: {
    userId?: string;
    userFullName?: string;
    sub_categories?: Array<any>;
  };
  MyPassRequestDetails: {
    request: any; // Full pass request object
    visitor: any; // Visitor object from the request
  };
  RequestDetails: {
    request: any; // Full pass request object
    visitor: any; // Visitor object from the request
  };
  LegislativeReject: {
    visitor: any; // Visitor object
    request: any; // Request object
    userId: string; // Current user ID
  };
  LegislativeApprove: {
    visitor: any; // Visitor object
    request: any; // Request object
    userId: string; // Current user ID
  };
  LegislativeRoute: {
    visitor: any; // Visitor object
    request: any; // Request object
    userId: string; // Current user ID
  };
};
