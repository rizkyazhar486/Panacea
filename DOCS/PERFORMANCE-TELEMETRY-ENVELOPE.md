# Performance Telemetry Envelope

One canonical event envelope is shared by sport, tactical athlete, environment, vehicle, dive and wearable streams.

Required concepts:
- stream + monotonic sequence;
- metric + unit;
- captured and received timestamps;
- measured / estimated / derived / relayed truth class;
- source/device identity;
- confidence/uncertainty;
- timestamp quality;
- synchronization group;
- optional position + accuracy.

Scientific overlays are allowed only when:
1. telemetry validates;
2. timestamps share a synchronization group;
3. clock skew stays within the requested tolerance.

This prevents a visually attractive graph from silently overlaying unsynchronized HR, vehicle, GPS, environment or dive streams.
