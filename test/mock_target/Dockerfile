FROM amothic/grpc-health-probe as health

FROM node:12

COPY --from=health /bin/grpc_health_probe /bin/grpc_health_probe
