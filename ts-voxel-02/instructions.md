# Voxelsrv

https://github.com/VoxelSrv/voxelsrv.git
https://github.com/VoxelSrv/voxelsrv-server-old.git

## Setup

In `ts-voxel-02` soll ein TypeScript projekt erstellt werden. Das projekt
soll eine 3D-Welt darstellen.
Im Ordner `ts-voxel-02/tmp` sind die beiden alten Projekte `voxelsrv` (3D Ansicht) und `voxelsrv-server` (Server Daten)
enthalten. voxelsrv kann mit voxelsrv-server als Backend oder included im Frontend laufen. Beide Projekte enthalten 
alte dependencies, die teilweise nicht mehr genutzt werden koennen.

Du kannst schritt fuer schritt die anwendung migrieren:
- Lege eine neue Projektstruktur in `ts-voxel-02` an.
- Analysiere `ts-voxel-02/tmp/voxelsrv` und `ts-voxel-02/tmp/voxelsrv-server`
- Welche neuen Versionen der dependencies sind in den beiden Projekten enthalten?
- Welche Dependencies muessen durch neue Technologie ausgetauscht werden?
- Erstelle in `ts-voxel-02` eine neue Version des Projekts. Der Server kann gleich als Demo enthalten bleiben,
  damit das Frontent standalone nutzbar bleibt, später soll ein anderer Server verwendet werden der dann die 
  gRPC-Schnittstelle nutzt. 
- Erstelle packages: client, core, server, protocol
- Übernehme alle model Strukturen von `ts-voxel-02/tmp/voxelsrv-server` wie z.B. 
  `ts-voxel-02/tmp/voxelsrv-server/src/lib/world/entity.ts` in core als model.
- Erstelle einen plan, wie schritt fuer schritt die gesammte Anwendung migriert werden soll.
- Fuehre den plan schritt fuer schritt aus

- Übernehme alle Controller/Manager
- Übernehme alle protobuf configurationen und sender und handler aus den projekten.
- Übernehme alle statischen dateien wie assets, texturen, sounds
