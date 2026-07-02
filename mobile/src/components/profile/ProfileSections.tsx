import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { EditProfileIcon } from "../icons/AppIcons";
import { CompactMatch } from "../matches/CompactMatch";
import { Field, PositionButton } from "../ui/FormControls";
import type {
  MatchResponse,
  PlayerPosition,
  PlayerProfileResponse,
  SavedFieldResponse,
} from "../../types/domain";
import {
  formatDate,
  formatDurationMinutes,
  positionLabel,
  publicHandle,
} from "../../utils/matchUtils";
import { ProfileStat } from "./ProfileWidgets";

type ProfileHeroProps = {
  isAdmin: boolean;
  profile: PlayerProfileResponse | null;
  profileCity: string;
  profileEditing: boolean;
  profilePosition: PlayerPosition;
  userName: string | null;
  playedMatchesCount: number;
  onToggleEditing: () => void;
};

export function ProfileHero({
  isAdmin,
  profile,
  profileCity,
  profileEditing,
  profilePosition,
  userName,
  playedMatchesCount,
  onToggleEditing,
}: ProfileHeroProps) {
  return (
    <View style={styles.profileHeroCard}>
      <View style={styles.profileGlowMark} />
      <View style={styles.profileHeroTopline}>
        <Text style={styles.profileEyebrow}>
          {isAdmin ? "Administrador" : "Jugador"}
        </Text>
        <Pressable style={styles.editProfileButton} onPress={onToggleEditing}>
          <EditProfileIcon active={profileEditing} />
        </Pressable>
      </View>
      <View style={styles.profileHeroBody}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarCore}>
            <Text style={styles.avatarInitial}>
              {(profile?.fullName || userName || "F").charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.profileIdentity}>
          <Text style={styles.profileName}>
            {profile?.fullName || userName || "Jugador Footy"}
          </Text>
          <Text style={styles.profileHandle}>
            {publicHandle(profile ?? { displayName: userName })}
          </Text>
          <Text style={styles.profileMeta}>
            {profile?.city || profileCity || "Ciudad pendiente"} -{" "}
            {positionLabel(profile?.preferredPosition ?? profilePosition)}
          </Text>
          {profile?.bio ? <Text style={styles.profileBioText}>{profile.bio}</Text> : null}
        </View>
      </View>
      <View style={styles.streakBanner}>
        <View style={styles.streakCircleLarge} />
        <View style={styles.streakCircleSmall} />
        <View style={styles.streakTextBlock}>
          <Text style={styles.streakLabel}>Partidos jugados</Text>
          <Text style={styles.streakSubLabel}>Historial de partidos inscritos</Text>
        </View>
        <Text style={styles.streakNumber}>{playedMatchesCount}</Text>
      </View>
    </View>
  );
}

type AdminFieldsPanelProps = {
  admin: {
    address: string;
    city: string;
    editingId: string | null;
    latitude: string;
    longitude: string;
    name: string;
    savedFields: SavedFieldResponse[];
  };
  loading: boolean;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onDeleteField: (field: SavedFieldResponse) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSaveField: () => void;
  onStartFieldCreate: () => void;
  onStartFieldEdit: (field: SavedFieldResponse) => void;
};

export function AdminFieldsPanel({
  admin,
  loading,
  onAddressChange,
  onCityChange,
  onDeleteField,
  onLatitudeChange,
  onLongitudeChange,
  onNameChange,
  onSaveField,
  onStartFieldCreate,
  onStartFieldEdit,
}: AdminFieldsPanelProps) {
  return (
    <View style={styles.adminPanel}>
      <View style={styles.adminPanelHeader}>
        <View>
          <Text style={styles.adminEyebrow}>Admin</Text>
          <Text style={styles.adminTitle}>Pistas guardadas</Text>
        </View>
        <Pressable style={styles.adminMiniButton} onPress={onStartFieldCreate}>
          <Text style={styles.adminMiniButtonText}>Nueva</Text>
        </Pressable>
      </View>
      <Field
        label="Nombre de pista"
        value={admin.name}
        onChangeText={onNameChange}
        placeholder="Campo Municipal"
      />
      <Field
        label="Direccion"
        value={admin.address}
        onChangeText={onAddressChange}
        placeholder="Calle, barrio..."
      />
      <Field label="Ciudad" value={admin.city} onChangeText={onCityChange} placeholder="Huelva" />
      <Field
        label="Latitud"
        value={admin.latitude}
        onChangeText={onLatitudeChange}
        keyboardType="decimal-pad"
        placeholder="37.261420"
      />
      <Field
        label="Longitud"
        value={admin.longitude}
        onChangeText={onLongitudeChange}
        keyboardType="decimal-pad"
        placeholder="-6.944720"
      />
      <Pressable style={styles.adminSaveButton} onPress={onSaveField} disabled={loading}>
        <Text style={styles.adminSaveButtonText}>
          {admin.editingId ? "Guardar pista" : "Anadir pista"}
        </Text>
      </Pressable>
      <View style={styles.adminFieldList}>
        {admin.savedFields.map((field) => (
          <View key={field.id} style={styles.adminFieldItem}>
            <View style={styles.adminFieldInfo}>
              <Text style={styles.adminFieldName}>{field.name}</Text>
              <Text style={styles.adminFieldMeta} numberOfLines={1}>
                {field.address || "Sin direccion"} - {field.city || "Sin ciudad"}
              </Text>
            </View>
            <Pressable style={styles.adminIconButton} onPress={() => onStartFieldEdit(field)}>
              <Text style={styles.adminIconButtonText}>Editar</Text>
            </Pressable>
            <Pressable
              style={[styles.adminIconButton, styles.adminDangerButton]}
              onPress={() => onDeleteField(field)}
            >
              <Text style={styles.adminIconButtonText}>Borrar</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

type ProfileEditorProps = {
  bio: string;
  city: string;
  fullName: string;
  loading: boolean;
  position: PlayerPosition;
  username: string;
  onBioChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onPositionChange: (value: PlayerPosition) => void;
  onSaveProfile: () => void;
  onUsernameChange: (value: string) => void;
};

export function ProfileEditor({
  bio,
  city,
  fullName,
  loading,
  position,
  username,
  onBioChange,
  onCityChange,
  onFullNameChange,
  onPositionChange,
  onSaveProfile,
  onUsernameChange,
}: ProfileEditorProps) {
  return (
    <View style={styles.profileEditor}>
      <Text style={styles.profileSectionTitle}>Editar perfil</Text>
      <Field
        label="Usuario"
        value={username}
        onChangeText={onUsernameChange}
        placeholder="tu_usuario"
        autoCapitalize="none"
      />
      <Field
        label="Nombre completo"
        value={fullName}
        onChangeText={onFullNameChange}
        placeholder="Tu nombre"
      />
      <Field label="Ciudad" value={city} onChangeText={onCityChange} placeholder="Huelva" />
      <View style={styles.positionGrid}>
        <PositionButton label="POR" value="GOALKEEPER" active={position === "GOALKEEPER"} onPress={onPositionChange} />
        <PositionButton label="DEF" value="DEFENDER" active={position === "DEFENDER"} onPress={onPositionChange} />
        <PositionButton label="MED" value="MIDFIELDER" active={position === "MIDFIELDER"} onPress={onPositionChange} />
        <PositionButton label="DEL" value="FORWARD" active={position === "FORWARD"} onPress={onPositionChange} />
      </View>
      <Field
        label="Bio"
        value={bio}
        onChangeText={onBioChange}
        placeholder="Como juegas, disponibilidad, pierna buena..."
        multiline
      />
      <Pressable style={styles.authButton} onPress={onSaveProfile} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0A110E" />
        ) : (
          <Text style={styles.authButtonText}>Guardar cambios</Text>
        )}
      </Pressable>
    </View>
  );
}

export function ProfileStatsRow({
  upcomingMatchesCount,
  playedMatchesCount,
}: {
  upcomingMatchesCount: number;
  playedMatchesCount: number;
}) {
  return (
    <View style={styles.profileStats}>
      <ProfileStat value={upcomingMatchesCount} label="Proximos" />
      <ProfileStat value={playedMatchesCount} label="Jugados" />
      <ProfileStat value="84%" label="Asistencia" />
    </View>
  );
}

export function NextMatchCard({
  nextMyMatch,
  onOpenMatch,
}: {
  nextMyMatch: MatchResponse | null;
  onOpenMatch: (matchId: string) => void;
}) {
  return (
    <View style={styles.nextMatchCard}>
      <Text style={styles.nextMatchEyebrow}>Proximo partido</Text>
      {nextMyMatch ? (
        <Pressable onPress={() => onOpenMatch(nextMyMatch.id)}>
          <Text style={styles.nextMatchTitle}>{nextMyMatch.title}</Text>
          <Text style={styles.nextMatchMeta}>
            {formatDate(nextMyMatch.startsAt)} -{" "}
            {formatDurationMinutes(nextMyMatch.durationMinutes)} -{" "}
            {nextMyMatch.field?.name ?? "Campo pendiente"}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.nextMatchMeta}>Unete a un partido para verlo aqui.</Text>
      )}
    </View>
  );
}

export function MyMatchesSection({
  matches,
  onOpenMatch,
}: {
  matches: MatchResponse[];
  onOpenMatch: (matchId: string) => void;
}) {
  return (
    <View style={styles.profileSection}>
      <Text style={styles.profileSectionTitle}>Mis partidos</Text>
      {matches.length === 0 ? (
        <Text style={styles.profileEmpty}>Aun no tienes partidos activos.</Text>
      ) : (
        matches.map((match) => (
          <CompactMatch key={match.id} match={match} onPress={() => onOpenMatch(match.id)} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeroCard: {
    minHeight: 238,
    borderRadius: 26,
    backgroundColor: "rgba(7,12,9,0.92)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.16)",
    overflow: "hidden",
    padding: 16,
    gap: 14,
  },
  profileGlowMark: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -58,
    top: -58,
    backgroundColor: "rgba(143,234,106,0.14)",
  },
  profileHeroTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  profileEyebrow: {
    color: "#8FEA6A",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  editProfileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeroBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(143,234,106,0.10)",
  },
  avatarCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#E3DBD0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#0A110E", fontSize: 30, fontWeight: "900" },
  profileIdentity: { flex: 1, gap: 5 },
  profileName: {
    color: "#E3DBD0",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "left",
  },
  profileHandle: {
    color: "rgba(227,219,208,0.62)",
    fontSize: 12,
    fontWeight: "900",
  },
  profileMeta: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  profileBioText: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "left",
    maxWidth: 230,
  },
  streakBanner: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.24)",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  streakCircleLarge: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    right: -38,
    top: -44,
    backgroundColor: "rgba(143,234,106,0.14)",
  },
  streakCircleSmall: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    left: -18,
    bottom: -28,
    backgroundColor: "rgba(179,243,81,0.08)",
  },
  streakTextBlock: { gap: 2 },
  streakLabel: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  streakSubLabel: {
    color: "rgba(247,241,232,0.62)",
    fontSize: 10,
    fontWeight: "800",
  },
  streakNumber: { color: "#8FEA6A", fontSize: 30, fontWeight: "900" },
  adminPanel: {
    backgroundColor: "rgba(7,12,9,0.92)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.22)",
    borderRadius: 24,
    padding: 14,
    gap: 12,
  },
  adminPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  adminEyebrow: {
    color: "#7FEF9B",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  adminTitle: { color: "#F7F1E8", fontSize: 20, fontWeight: "900" },
  adminMiniButton: {
    minHeight: 38,
    borderRadius: 17,
    backgroundColor: "rgba(127,239,155,0.18)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.34)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adminMiniButtonText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  adminSaveButton: {
    minHeight: 48,
    borderRadius: 20,
    backgroundColor: "#7FEF9B",
    alignItems: "center",
    justifyContent: "center",
  },
  adminSaveButtonText: { color: "#07100A", fontWeight: "900" },
  adminFieldList: { gap: 8 },
  adminFieldItem: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminFieldInfo: { flex: 1 },
  adminFieldName: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  adminFieldMeta: {
    color: "rgba(247,241,232,0.62)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  adminIconButton: {
    minHeight: 34,
    borderRadius: 14,
    backgroundColor: "rgba(127,239,155,0.16)",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  adminDangerButton: { backgroundColor: "rgba(217,88,88,0.24)" },
  adminIconButtonText: { color: "#F7F1E8", fontSize: 10, fontWeight: "900" },
  profileEditor: {
    backgroundColor: "rgba(7,12,9,0.92)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    borderRadius: 24,
    padding: 14,
    gap: 14,
  },
  profileSectionTitle: { color: "#E3DBD0", fontSize: 17, fontWeight: "900" },
  positionGrid: { flexDirection: "row", gap: 8 },
  authButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: { color: "#0A110E", fontSize: 15, fontWeight: "900" },
  profileStats: { flexDirection: "row", gap: 8 },
  nextMatchCard: {
    borderRadius: 26,
    backgroundColor: "rgba(143,234,106,0.16)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.26)",
    padding: 16,
    gap: 8,
    overflow: "hidden",
  },
  nextMatchEyebrow: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  nextMatchTitle: { color: "#F7F1E8", fontSize: 22, fontWeight: "900" },
  nextMatchMeta: {
    color: "rgba(247,241,232,0.78)",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 17,
  },
  profileSection: { gap: 12 },
  profileEmpty: { color: "#9CA3AF", fontSize: 14 },
});
