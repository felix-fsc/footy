import type { useAdminFields } from "../../hooks/useAdminFields";
import type { useAppNavigation } from "../../hooks/useAppNavigation";
import type { useAppViewActions } from "../../hooks/useAppViewActions";
import type { useHomeActions } from "../../hooks/useHomeActions";
import type { useMatchActions } from "../../hooks/useMatchActions";
import type { useMatchDraft } from "../../hooks/useMatchDraft";
import type { useMatchEditorActions } from "../../hooks/useMatchEditorActions";
import type { useMatches } from "../../hooks/useMatches";
import type { useProfile } from "../../hooks/useProfile";
import type { useProfileActions } from "../../hooks/useProfileActions";
import { openMatchDirections } from "../../platform/directions";
import { CreateMatchScreen } from "../../screens/CreateMatchScreen";
import { HomeScreen } from "../../screens/HomeScreen";
import { LocationScreen } from "../../screens/LocationScreen";
import { MatchDetailScreen } from "../../screens/MatchDetailScreen";
import { ProfileScreen } from "../../screens/ProfileScreen";
import { getMatchViewerState } from "../../utils/matchUtils";

type AppTabRendererProps = {
  adminFields: ReturnType<typeof useAdminFields>;
  bottomInset: number;
  currentUserId: string | null;
  homeActions: ReturnType<typeof useHomeActions>;
  isAdmin: boolean;
  loading: boolean;
  matchActions: ReturnType<typeof useMatchActions>;
  matchDraft: ReturnType<typeof useMatchDraft>;
  matchDraftCity: string;
  matchEditorActions: ReturnType<typeof useMatchEditorActions>;
  matchesState: ReturnType<typeof useMatches>;
  navigation: ReturnType<typeof useAppNavigation>;
  onLogout: () => void;
  profileActions: ReturnType<typeof useProfileActions>;
  profileState: ReturnType<typeof useProfile>;
  topInset: number;
  userCity: string;
  userName: string | null;
  viewActions: ReturnType<typeof useAppViewActions>;
};

export function AppTabRenderer({
  adminFields,
  bottomInset,
  currentUserId,
  homeActions,
  isAdmin,
  loading,
  matchActions,
  matchDraft,
  matchDraftCity,
  matchEditorActions,
  matchesState,
  navigation,
  onLogout,
  profileActions,
  profileState,
  topInset,
  userCity,
  userName,
  viewActions,
}: AppTabRendererProps) {
  const selectedMatchViewerState = getMatchViewerState(
    matchesState.selectedMatch,
    currentUserId,
  );

  if (navigation.appTab === "profile") {
    return (
      <ProfileScreen
        admin={{
          address: adminFields.address,
          city: adminFields.city,
          editingId: adminFields.editingId,
          isAdmin,
          latitude: adminFields.latitude,
          longitude: adminFields.longitude,
          name: adminFields.name,
          savedFields: adminFields.savedFields,
        }}
        adminActions={{
          onAddressChange: adminFields.setAddress,
          onCityChange: adminFields.setCity,
          onDeleteField: adminFields.remove,
          onLatitudeChange: adminFields.setLatitude,
          onLongitudeChange: adminFields.setLongitude,
          onNameChange: adminFields.setName,
          onSaveField: adminFields.save,
          onStartFieldCreate: adminFields.startCreate,
          onStartFieldEdit: adminFields.startEdit,
        }}
        layout={{
          bottomInset,
          topInset,
        }}
        navigation={{
          onCreate: navigation.startMatchCreate,
          onHome: navigation.goHome,
          onOpenMatch: navigation.openDetail,
          onProfile: navigation.openProfile,
        }}
        profileActions={{
          onBioChange: profileState.setBio,
          onCityChange: profileState.setCity,
          onFullNameChange: profileState.setFullName,
          onLogout,
          onPositionChange: profileState.setPosition,
          onSaveProfile: profileActions.saveProfile,
          onToggleEditing: profileState.toggleEditing,
          onUsernameChange: profileState.setUsername,
        }}
        profileData={{
          bio: profileState.bio,
          city: profileState.city,
          editing: profileState.editing,
          fullName: profileState.fullName,
          loading,
          myMatches: matchesState.myMatches,
          nextMyMatch: matchesState.nextMyMatch,
          position: profileState.position,
          profile: profileState.profile,
          userName,
          username: profileState.username,
          victoryStreak: matchesState.victoryStreak,
        }}
      />
    );
  }

  if (navigation.appTab === "location") {
    return (
      <LocationScreen
        latitude={matchDraft.latitude}
        longitude={matchDraft.longitude}
        city={matchDraftCity}
        fieldName={matchDraft.fieldName}
        topInset={topInset}
        bottomInset={bottomInset}
        onBack={navigation.backToCreate}
        onUseLocation={navigation.backToCreate}
        onLocationChange={viewActions.applyLocationToDraft}
      />
    );
  }

  if (navigation.appTab === "create") {
    return (
      <CreateMatchScreen
        actions={{
          onClose: matchDraft.editingMatchId
            ? navigation.closeMatchEditor
            : navigation.goHome,
          onClosePreview: viewActions.closePreview,
          onDateChange: matchDraft.setDate,
          onFieldNameChange: matchDraft.setFieldName,
          onMaxPlayersChange: matchDraft.setMaxPlayers,
          onOpenLocationPicker: navigation.openLocationPicker,
          onOpenPreview: matchEditorActions.openCreatePreview,
          onPricePerPersonChange: matchDraft.setPricePerPerson,
          onSelectSavedField: matchDraft.selectSavedField,
          onSubmit: matchEditorActions.createMatch,
          onTimeChange: matchDraft.setTime,
          onTitleChange: matchDraft.setTitle,
          onToggleCalendar: matchDraft.toggleCalendar,
        }}
        draft={{
          city: matchDraft.city,
          date: matchDraft.date,
          fieldName: matchDraft.fieldName,
          latitude: matchDraft.latitude,
          longitude: matchDraft.longitude,
          maxPlayers: matchDraft.maxPlayers,
          pricePerPerson: matchDraft.pricePerPerson,
          selectedSavedFieldId: matchDraft.selectedSavedFieldId,
          time: matchDraft.time,
          title: matchDraft.title,
        }}
        editor={{
          editingMatchId: matchDraft.editingMatchId,
          loading,
          savedFields: adminFields.savedFields,
          selectedMatch: matchesState.selectedMatch,
          showCalendar: matchDraft.showCalendar,
          showPreview: matchDraft.showPreview,
        }}
        layout={{
          bottomInset,
          topInset,
        }}
        navigation={{
          onCreateTab: navigation.startMatchCreate,
          onHome: navigation.goHome,
          onProfile: navigation.openProfile,
        }}
      />
    );
  }

  if (navigation.appTab === "detail") {
    return (
      <MatchDetailScreen
        actions={{
          onCancelMatch: matchActions.cancelMatch,
          onDeleteMatch: matchActions.deleteMatch,
          onEditMatch: navigation.startMatchEdit,
          onJoinMatch: matchActions.joinMatch,
          onLeaveMatch: matchActions.leaveMatch,
          onOpenDirections: openMatchDirections,
          onOpenProfile: profileActions.openPublicProfile,
          onRemovePlayer: matchActions.removeMatchPlayer,
        }}
        chat={{
          messageText: matchActions.messageText,
          messages: matchActions.messages,
          onCloseChat: matchActions.closeChat,
          onMessageTextChange: matchActions.setMessageText,
          onOpenChat: matchActions.openChat,
          onQuickMessage: matchActions.sendMatchMessage,
          onRefreshMessages: matchActions.loadMessages,
          onSendMessage: matchActions.sendMessage,
          showMatchChat: matchActions.showMatchChat,
        }}
        layout={{
          bottomInset,
          topInset,
        }}
        navigation={{
          onCreate: navigation.startMatchCreate,
          onHome: navigation.goHome,
          onProfile: navigation.openProfile,
        }}
        publicProfileState={{
          onClosePublicProfile: viewActions.closePublicProfile,
          publicProfile: profileState.publicProfile,
          showPublicProfile: profileState.showPublicProfile,
        }}
        state={{
          isAdmin,
          loading,
          match: matchesState.selectedMatch,
          selectedIsOpen: selectedMatchViewerState.isOpen,
          selectedIsOwner: selectedMatchViewerState.isOwner,
          selectedIsParticipant: selectedMatchViewerState.isParticipant,
        }}
      />
    );
  }

  return (
    <HomeScreen
      actions={{
        onHomeModeChange: navigation.setHomeMode,
        onOpenDetail: navigation.openDetail,
        onRefresh: homeActions.refreshMatches,
        onSearchQueryChange: matchesState.setSearchQuery,
        onSelectMatch: matchesState.setSelectedMatchId,
      }}
      data={{
        currentUserId,
        loading,
        matches: matchesState.visibleMatches,
        myMatches: matchesState.myMatches,
        searchQuery: matchesState.searchQuery,
        selectedMatch: matchesState.selectedMatch,
        selectedMatchId: matchesState.selectedMatchId,
        userCity,
        victoryStreak: matchesState.victoryStreak,
      }}
      layout={{
        topInset,
      }}
      navigation={{
        onCreate: navigation.startMatchCreate,
        onHome: navigation.goHome,
        onProfile: navigation.openProfile,
      }}
      view={{
        homeMode: navigation.homeMode,
      }}
    />
  );
}
