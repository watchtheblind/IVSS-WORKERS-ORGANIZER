import { ConfigRepository, HospitalSettings } from '../../domain/ports/ConfigRepository';
import { SyncService } from '../../domain/ports/SyncService';

let syncInProgress = false;

export class SyncConfigUseCase {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly syncService: SyncService
  ) {}

  async execute(): Promise<{ pushed: number; pulled: number }> {
    if (syncInProgress) {
      return { pushed: 0, pulled: 0 };
    }
    syncInProgress = true;
    try {
      let pushed = 0;
      let pulled = 0;

      // Departments (Áreas)
      const localDepts = await this.configRepository.getDepartments();
      await this.syncService.pushDepartments(localDepts);
      pushed += localDepts.length;
      const remoteDepts = await this.syncService.pullDepartments();
      for (const name of remoteDepts) {
        await this.configRepository.addDepartment(name);
        pulled++;
      }

      // Shifts (Turnos)
      const localShifts = await this.configRepository.getShifts();
      await this.syncService.pushShifts(localShifts);
      pushed += localShifts.length;
      const remoteShifts = await this.syncService.pullShifts();
      for (const shift of remoteShifts) {
        await this.configRepository.addShift(shift);
        pulled++;
      }

      // Rooms (Salas)
      const localRooms = await this.configRepository.getRooms();
      await this.syncService.pushRooms(localRooms);
      pushed += localRooms.length;
      const remoteRooms = await this.syncService.pullRooms();
      for (const room of remoteRooms) {
        await this.configRepository.addRoom(room);
        pulled++;
      }

      // Hospital settings (name + show logo; logo URI stays local-only)
      const localSettings = await this.configRepository.getHospitalSettings();
      const localRecord: Record<string, string> = {
        hospital_name: localSettings.hospitalName,
        hospital_show_logo: localSettings.showLogo ? '1' : '0',
      };
      await this.syncService.pushSettings(localRecord);
      pushed += Object.keys(localRecord).length;

      const remoteRecord = await this.syncService.pullSettings();
      const merged: HospitalSettings = {
        hospitalName:
          remoteRecord.hospital_name ?? localSettings.hospitalName,
        showLogo:
          remoteRecord.hospital_show_logo === undefined
            ? localSettings.showLogo
            : remoteRecord.hospital_show_logo === '1',
        logoUri: localSettings.logoUri,
      };
      await this.configRepository.saveHospitalSettings(merged);
      pulled += Object.keys(remoteRecord).length;

      return { pushed, pulled };
    } finally {
      syncInProgress = false;
    }
  }
}