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
import IssueVisitorPassScreen from "@/screens/IssueVisitorPassScreen";
import PreviewPassScreen from "@/screens/PreviewPassScreen";
import LoginMethodSelectionScreen from "@/screens/LoginMethodSelectionScreen";
import UsernameOTPLoginScreen from "@/screens/UsernameOTPLoginScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const setUpNavigation = (
  navigationRef?: React.RefObject<NavigationContainerRef<RootStackParamList> | null>
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
        <Stack.Screen name="PreCheck" component={PreCheckScreen} />
        <Stack.Screen name="QRScan" component={QRScanScreen} />
        <Stack.Screen name="ValidPass" component={ValidPassScreen} />
        <Stack.Screen name="InvalidPass" component={InvalidPassScreen} />
        <Stack.Screen
          name="IssueVisitorPass"
          component={IssueVisitorPassScreen}
        />
        <Stack.Screen name="PreviewPass" component={PreviewPassScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
