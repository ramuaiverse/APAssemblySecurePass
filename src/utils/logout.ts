import { Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types";
import { authStorage } from "./authStorage";

// Define a type that only requires the replace method we need
type NavigationWithReplace = {
  replace: (route: "LoginMethodSelection") => void;
};

// Accept any navigation prop that extends NativeStackNavigationProp or has the replace method
export const handleLogout = async (
  navigation: NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList> | NavigationWithReplace,
): Promise<void> => {
  Alert.alert("Logout", "Do you want to log out?", [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Yes",
      onPress: async () => {
        // Clear auth data
        await authStorage.clearAuthData();
        navigation.replace("LoginMethodSelection");
      },
    },
  ]);
};
