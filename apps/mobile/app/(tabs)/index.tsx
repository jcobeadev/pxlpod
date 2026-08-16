import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { overlayUrl, useAlbums, useAppContent, useEvents, useLiveEvent, useTemplates } from "@poplab/api";

import {
  BookUsCta,
  HomeLoading,
  HomeOffline,
  LiveBanner,
  PastEventsRow,
  PortfolioRow,
  RecentStripsRow,
  StartSessionHero,
  StartSessionHeroVideo,
  TemplatesRow,
  UpcomingEvents,
} from "../../src/components/home";
import { colors } from "../../src/theme";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

// 04 Home / 04b Home loading / 04c Home offline / 04d Home scrolled
// (design/PXLPOD App.dc.html).
//
// This screen renders inside the shared (tabs) Tabs navigator, whose
// ShellHeader + ShellTabBar (app/(tabs)/_layout.tsx) already reserve the top
// and bottom safe-area insets — a nested <Screen> here would double them up,
// so the content area is a plain full-bleed View, matching the precedent set
// by the other (still-placeholder) tab screens.
export default function HomeTab() {
  const client = usePoplabClient();
  const router = useRouter();

  const liveEventQuery = useLiveEvent(client, TENANT_ID);
  const templatesQuery = useTemplates(client, TENANT_ID);
  const upcomingQuery = useEvents(client, TENANT_ID, { when: "upcoming" });
  const pastQuery = useEvents(client, TENANT_ID, { when: "past" });
  const albumsQuery = useAlbums(client, TENANT_ID);
  const contentQuery = useAppContent(client, TENANT_ID);

  const [dismissedLiveEventId, setDismissedLiveEventId] = useState<string | null>(null);

  const resolveThumbnail = useMemo(() => (path: string) => overlayUrl(client, path), [client]);
  const resolveCover = useMemo(
    () => (path: string) => client.storage.from("albums").getPublicUrl(path).data.publicUrl,
    [client],
  );

  const queries = [liveEventQuery, templatesQuery, upcomingQuery, pastQuery];
  const allPending = queries.every((query) => query.isPending);
  const allErrored = queries.every((query) => query.isError);

  const handleRetry = () => {
    void Promise.all(queries.map((query) => query.refetch()));
  };

  if (allPending) {
    return <HomeLoading />;
  }

  if (allErrored) {
    return <HomeOffline onRetry={handleRetry} />;
  }

  const liveEvent = liveEventQuery.data ?? null;
  const templates = templatesQuery.data ?? [];
  const pastEvents = pastQuery.data ?? [];
  // RLS already returns only published albums to a guest, but filter defensively.
  const albums = (albumsQuery.data ?? []).filter((a) => a.is_published);
  const heroCaption = (contentQuery.data?.hero as { body?: string } | undefined)?.body;
  const useVideoHero = (contentQuery.data?.home_hero_video as { body?: string } | undefined)?.body === "on";
  // "Upcoming" includes the pop-up that's live right now (its window hasn't
  // closed yet) — the live banner already covers that one, so it's excluded
  // here to avoid showing the same event twice.
  const upcomingEvents = (upcomingQuery.data ?? []).filter((event) => event.id !== liveEvent?.id);

  const showLiveBanner = liveEvent !== null && liveEvent.id !== dismissedLiveEventId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT }}>
      <ScrollView contentContainerStyle={{ paddingTop: 6, paddingBottom: 14, gap: 22 }}>
        {showLiveBanner && liveEvent ? (
          <LiveBanner eventTitle={liveEvent.title} onDismiss={() => setDismissedLiveEventId(liveEvent.id)} />
        ) : null}

        {useVideoHero ? (
          <StartSessionHeroVideo onPress={() => router.push("/session")} caption={heroCaption} />
        ) : (
          <StartSessionHero onPress={() => router.push("/session")} caption={heroCaption} />
        )}

        <TemplatesRow
          templates={templates}
          resolveThumbnail={resolveThumbnail}
          onSeeAll={() => router.push("/templates")}
        />

        <RecentStripsRow />

        <PortfolioRow
          albums={albums}
          resolveCover={resolveCover}
          onOpen={(id) => router.push(`/portfolio/${id}`)}
          onSeeAll={() => router.push("/portfolio")}
        />

        <PastEventsRow events={pastEvents} resolveCover={resolveCover} />

        <UpcomingEvents events={upcomingEvents} />

        <BookUsCta onPress={() => router.push("/book")} />
      </ScrollView>
    </View>
  );
}
