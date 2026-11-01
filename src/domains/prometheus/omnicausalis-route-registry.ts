export interface OmnicausalisRouteDescriptor {
  readonly routeId: string;
  readonly path: string;
  readonly componentName: string;
  readonly argonPrDependencies: readonly number[];
  readonly truthClass: "SIMULATED_EDUCATIONAL";
}

export const OMNICAUSALIS_PROMETHEUS_ROUTES: readonly OmnicausalisRouteDescriptor[] = [
  {
    routeId: "PROMETHEUS_ANIME_SPARRING_ARENA",
    path: "/prometheus/arena/anime-rivals",
    componentName: "CompetitiveAnimeTrainingArena",
    argonPrDependencies: [2965, 2966, 2967, 2968, 2969, 2970],
    truthClass: "SIMULATED_EDUCATIONAL"
  },
  {
    routeId: "BODY_EXPOSURE_VRM_DUAL_VIEWPORT",
    path: "/body-exposure/golden-journey/dual-viewport",
    componentName: "AnimeVrmDualViewportCanvas",
    argonPrDependencies: [2954, 2956, 2960, 2961, 2963, 2964, 2970],
    truthClass: "SIMULATED_EDUCATIONAL"
  }
];