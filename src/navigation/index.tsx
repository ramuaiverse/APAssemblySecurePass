import React from "react";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types";

import LoginScreen from "@/screens/LoginScreen";
import PreCheckScreen from "@/screens/PreCheckScreen";
import QRScanScreen from "@/screens/QRScanScreen";
import ValidPassScreen from "@/screens/ValidPassScreen";
import InvalidPassScreen from "@/screens/InvalidPassScreen";
import HomeScreen from "@/screens/HomeScreen";
import VisitorsScreen from "@/screens/VisitorsScreen";
import VisitorDetailsScreen from "@/screens/VisitorDetailsScreen";
import IssueVisitorPassScreen from "@/screens/IssueVisitorPassScreen";
import PreviewPassScreen from "@/screens/PreviewPassScreen";
import LoginMethodSelectionScreen from "@/screens/LoginMethodSelectionScreen";
import UsernameOTPLoginScreen from "@/screens/UsernameOTPLoginScreen";
import SetPasswordScreen from "@/screens/SetPasswordScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "@/screens/ResetPasswordScreen";
import MyPassRequestsScreen from "@/screens/MyPassRequestsScreen";
import RequestVisitorPassScreen from "@/screens/RequestVisitorPassScreen";
import MyPassRequestDetailsScreen from "@/screens/MyPassRequestDetailsScreen";
import LegislativeRejectScreen from "@/screens/LegislativeRejectScreen";
import LegislativeApproveScreen from "@/screens/LegislativeApproveScreen";
import LegislativeRouteScreen from "@/screens/LegislativeRouteScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const setUpNavigation = (
  navigationRef?: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
) => {
  return (
    <NavigationContainer ref={navigationRef || undefined}>
      <Stack.Navigator
        initialRouteName="LoginMethodSelection"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="LoginMethodSelection"
          component={LoginMethodSelectionScreen}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="UsernameOTPLogin"
          component={UsernameOTPLoginScreen}
        />
        <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="PreCheck" component={PreCheckScreen} />
        <Stack.Screen name="QRScan" component={QRScanScreen} />
        <Stack.Screen name="ValidPass" component={ValidPassScreen} />
        <Stack.Screen name="InvalidPass" component={InvalidPassScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Visitors" component={VisitorsScreen} />
        <Stack.Screen name="VisitorDetails" component={VisitorDetailsScreen} />
        <Stack.Screen
          name="IssueVisitorPass"
          component={IssueVisitorPassScreen}
        />
        <Stack.Screen name="PreviewPass" component={PreviewPassScreen} />
        <Stack.Screen name="MyPassRequests" component={MyPassRequestsScreen} />
        <Stack.Screen
          name="RequestVisitorPass"
          component={RequestVisitorPassScreen}
        />
        <Stack.Screen
          name="MyPassRequestDetails"
          component={MyPassRequestDetailsScreen}
        />
        <Stack.Screen
          name="LegislativeReject"
          component={LegislativeRejectScreen}
        />
        <Stack.Screen
          name="LegislativeApprove"
          component={LegislativeApproveScreen}
        />
        <Stack.Screen
          name="LegislativeRoute"
          component={LegislativeRouteScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
