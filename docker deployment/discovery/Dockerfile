FROM adoptopenjdk/openjdk11
VOLUME /tmp
ARG JAR_FILE
ARG PROPERTIES_YML
ARG BOOTSTRAP_YML
ARG CERT
ARG CERT_P12
COPY ${JAR_FILE} app.jar
COPY ${PROPERTIES_YML} application.yml
COPY ${BOOTSTRAP_YML} bootstrap.yml
COPY ${CERT} $JAVA_HOME/lib/security/obsidian3.cert
COPY ${CERT_P12} /certificates/obsidian3.p12
RUN cd $JAVA_HOME/lib/security && keytool -cacerts -storepass changeit -noprompt -trustcacerts -importcert -alias alias -file cert.cert
ENTRYPOINT ["java","-jar","/app.jar"]