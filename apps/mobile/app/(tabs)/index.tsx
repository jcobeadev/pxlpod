import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { requireOptionalNativeModule } from "expo";
import { useRouter } from "expo-router";
import { overlayUrl, useAppContent, useEvents, useLiveEvent, usePublishedPhotos, useTemplates } from "@poplab/api";

import {
  BookUsCta,
  HomeLoading,
  HomeOffline,
  LiveBanner,
  PastEventsRow,
  PortfolioMarquee,
  RecentStripsRow,
  StartSessionHero,
  StartSessionHeroVideo,
  TemplatesRow,
  UpcomingEvents,
} from "../../src/components/home";
import { colors } from "../../src/theme";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { usePoplabClient } from "../_layout";

// expo-video is native; keep it out of the eager import graph so a build without
// the module doesn't crash Home. It's lazy-loaded — but ONLY when the native
// module is actually present. On a build that predates the module, importing it
// throws at module-eval ("Cannot find native module 'ExpoVideo'"), which Metro
// surfaces as a lazy-resolves-to-undefined render error the ErrorBoundary can't
// swallow — so we gate on the module existing and fall back to the sprite tile.
const StartSessionHeroMp4 = lazy(() => import("../../src/components/home/StartSessionHeroMp4"));
const HAS_NATIVE_VIDEO = requireOptionalNativeModule("ExpoVideo") != null;

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
  const photosQuery = usePublishedPhotos(client, TENANT_ID);
  const contentQuery = useAppContent(client, TENANT_ID);

  const [dismissedLiveEventId, setDismissedLiveEventId] = useState<string | null>(null);

  const resolveThumbnail = useMemo(() => (path: string) => overlayUrl(client, path), [client]);
  const resolveCover = useMemo(
    () => (path: string) => client.storage.from("albums").getPublicUrl(path).data.publicUrl,
    [client],
  );
  // Small, fast-loading version for the portfolio marquee. resize:"contain"
  // keeps the whole image and its aspect ratio (and applies EXIF orientation);
  // a plain width-only transform on this project returns a distorted image.
  const resolvePhotoThumb = useMemo(
    () => (path: string) =>
      client.storage
        .from("albums")
        .getPublicUrl(path, { transform: { width: 600, height: 600, resize: "contain", quality: 60 } }).data.publicUrl,
    [client],
  );

  const queries = [liveEventQuery, templatesQuery, upcomingQuery, pastQuery];
  const allPending = queries.every((query) => query.isPending);
  const allErrored = queries.every((query) => query.isError);

  // Pull-to-refresh refetches everything the screen shows (events, templates,
  // portfolio photos, content), not just the gating queries.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        [liveEventQuery, templatesQuery, upcomingQuery, pastQuery, photosQuery, contentQuery].map((q) => q.refetch()),
      );
    } finally {
      setRefreshing(false);
    }
  }, [liveEventQuery, templatesQuery, upcomingQuery, pastQuery, photosQuery, contentQuery]);

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
  const portfolioPhotos = photosQuery.data ?? [];
  const heroCaption = (contentQuery.data?.hero as { body?: string } | undefined)?.body;
  const useVideoHero = (contentQuery.data?.home_hero_video as { body?: string } | undefined)?.body === "on";
  // "Newly added" (templates) is opt-in — hidden unless the console turns it on.
  const showTemplates = (contentQuery.data?.home_templates as { body?: string } | undefined)?.body === "on";
  // "Upcoming" includes the pop-up that's live right now (its window hasn't
  // closed yet) — the live banner already covers that one, so it's excluded
  // here to avoid showing the same event twice.
  const upcomingEvents = (upcomingQuery.data ?? []).filter((event) => event.id !== liveEvent?.id);

  const showLiveBanner = liveEvent !== null && liveEvent.id !== dismissedLiveEventId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 14, gap: 22 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {showLiveBanner && liveEvent ? (
          <LiveBanner eventTitle={liveEvent.title} onDismiss={() => setDismissedLiveEventId(liveEvent.id)} />
        ) : null}

        {useVideoHero && HAS_NATIVE_VIDEO ? (
          <ErrorBoundary fallback={<StartSessionHeroVideo onPress={() => router.push("/session")} caption={heroCaption} />}>
            <Suspense fallback={<StartSessionHeroVideo onPress={() => router.push("/session")} caption={heroCaption} />}>
              <StartSessionHeroMp4 onPress={() => router.push("/session")} caption={heroCaption} />
            </Suspense>
          </ErrorBoundary>
        ) : useVideoHero ? (
          <StartSessionHeroVideo onPress={() => router.push("/session")} caption={heroCaption} />
        ) : (
          <StartSessionHero onPress={() => router.push("/session")} caption={heroCaption} />
        )}

        <PortfolioMarquee
          photos={portfolioPhotos}
          resolvePhoto={resolvePhotoThumb}
          onSeeAll={() => router.push("/portfolio")}
        />

        <RecentStripsRow />

        {showTemplates ? (
          <TemplatesRow
            templates={templates}
            resolveThumbnail={resolveThumbnail}
            onSeeAll={() => router.push("/templates")}
          />
        ) : null}

        <PastEventsRow events={pastEvents} resolveCover={resolveCover} />

        <UpcomingEvents events={upcomingEvents} />

        <BookUsCta onPress={() => router.push("/book")} />
      </ScrollView>
    </View>
  );
}
