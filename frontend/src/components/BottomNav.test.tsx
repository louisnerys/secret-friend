import { render, fireEvent } from "@testing-library/react";
import BottomNav from "./BottomNav";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe("BottomNav Component", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);

    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
    } as any);
  });

  it("renders global context with events active tab", () => {
    const { getByRole, queryByLabelText, getByLabelText } = render(
      <BottomNav context="global" activeTab="events" />
    );

    // Active Events tab is rendered as status
    const activeTab = getByRole("status");
    expect(activeTab.textContent).toContain("dashboard.nav_events");

    // Other tabs are rendered as links/buttons
    const newEventLink = getByLabelText("dashboard.create_event", { selector: "a" });
    expect(newEventLink.getAttribute("href")).toBe("/novo-evento");

    // Admin should not be visible since isAdmin is false
    expect(queryByLabelText("common.admin")).toBeNull();
  });

  it("renders global context with new-event active tab", () => {
    const { getByRole, getByLabelText } = render(
      <BottomNav context="global" activeTab="new-event" />
    );

    const activeTab = getByRole("status");
    expect(activeTab.textContent).toContain("dashboard.create_event");

    const eventsLink = getByLabelText("dashboard.nav_events", { selector: "a" });
    expect(eventsLink.getAttribute("href")).toBe("/dashboard");
  });

  it("renders global context with admin tab when isAdmin is true", () => {
    const { getByLabelText } = render(
      <BottomNav context="global" activeTab="events" isAdmin={true} />
    );

    const adminLink = getByLabelText("common.admin", { selector: "a" });
    expect(adminLink.getAttribute("href")).toBe("/admin");
  });

  it("renders global context with admin active tab when isAdmin is true and activeTab is admin", () => {
    const { getByRole } = render(
      <BottomNav context="global" activeTab="admin" isAdmin={true} />
    );

    const activeTab = getByRole("status");
    expect(activeTab.textContent).toContain("common.admin");
  });

  it("handles logout successfully", async () => {
    const { getByLabelText } = render(
      <BottomNav context="global" activeTab="events" />
    );

    const logoutButton = getByLabelText("common.logout", { selector: "button" });
    fireEvent.click(logoutButton);

    expect(supabase.auth.signOut).toHaveBeenCalled();
    // Wait for the async router push
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("renders event context with event-details active tab", () => {
    const { getByRole, getByLabelText, queryByLabelText } = render(
      <BottomNav
        context="event"
        activeTab="event-details"
        eventId="test-event-id"
      />
    );

    const backLink = getByLabelText("common.back", { selector: "a" });
    expect(backLink.getAttribute("href")).toBe("/dashboard");

    const activeTab = getByRole("status");
    expect(activeTab.textContent).toContain("event.nav_events");

    // Draw should not be visible when isParticipant or isDrawn are false
    expect(queryByLabelText("event.nav_draw")).toBeNull();
  });

  it("renders event context with event link (inactive tab)", () => {
    const { getByLabelText } = render(
      <BottomNav
        context="event"
        activeTab="draw"
        eventId="test-event-id"
        isParticipant={true}
        isDrawn={true}
      />
    );

    const eventDetailsLink = getByLabelText("event.nav_events", { selector: "a" });
    expect(eventDetailsLink.getAttribute("href")).toBe("/evento/test-event-id");
  });

  it("renders event context with draw active tab", () => {
    const { getByRole, getByLabelText } = render(
      <BottomNav
        context="event"
        activeTab="draw"
        eventId="test-event-id"
        isParticipant={true}
        isDrawn={true}
      />
    );

    const activeTab = getByRole("status");
    expect(activeTab.textContent).toContain("event.nav_draw");

    const eventDetailsLink = getByLabelText("event.nav_events", { selector: "a" });
    expect(eventDetailsLink.getAttribute("href")).toBe("/evento/test-event-id");
  });

  it("renders event context with draw link (inactive tab)", () => {
    const { getByLabelText } = render(
      <BottomNav
        context="event"
        activeTab="event-details"
        eventId="test-event-id"
        isParticipant={true}
        isDrawn={true}
      />
    );

    const drawLink = getByLabelText("event.nav_draw", { selector: "a" });
    expect(drawLink.getAttribute("href")).toBe("/evento/test-event-id/draw");
  });
});
