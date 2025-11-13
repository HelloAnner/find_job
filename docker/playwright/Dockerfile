# syntax=docker/dockerfile:1.7
ARG PLAYWRIGHT_VERSION=1.52.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-jammy

ARG PLAYWRIGHT_VERSION
ENV PLAYWRIGHT_VERSION=${PLAYWRIGHT_VERSION}

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl unzip ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    DRIVER_DIR="/opt/ms-playwright-go/${PLAYWRIGHT_VERSION}"; \
    mkdir -p "${DRIVER_DIR}"; \
    curl -fsSL "https://playwright.azureedge.net/builds/driver/playwright-${PLAYWRIGHT_VERSION}-linux.zip" -o /tmp/driver.zip; \
    unzip /tmp/driver.zip -d "${DRIVER_DIR}"; \
    rm /tmp/driver.zip; \
    chmod +x "${DRIVER_DIR}/node"

COPY docker/playwright/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PW_BROWSERS_SOURCE=/ms-playwright \
    PW_DRIVER_SOURCE=/opt/ms-playwright-go/${PLAYWRIGHT_VERSION} \
    PW_BROWSERS_TARGET=/srv/playwright/browsers \
    PW_DRIVER_TARGET=/srv/playwright/driver

VOLUME ["/srv/playwright/browsers", "/srv/playwright/driver"]
ENTRYPOINT ["/entrypoint.sh"]
CMD ["sleep", "infinity"]
