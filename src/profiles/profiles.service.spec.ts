import { ProfilesService } from './profiles.service';

describe('profiles service', () => {
  let service: ProfilesService;

  beforeEach(() => {
    service = new ProfilesService();
  });

  describe('create', () => {
    it('creates new profile', () => {
      service.create({
        firstName: 'test-first-name',
        lastName: 'test-last-name',
        age: 13,
      });

      expect(service.profiles).toEqual([
        {
          id: expect.any(Number),
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
      ]);
    });
  });

  describe('getAll', () => {
    it('returns all profiles', () => {
      service.profiles = [
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
      ];

      expect(service.getAll()).toEqual([
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
      ]);
    });
  });

  describe('getOne', () => {
    it('returns single profile', () => {
      service.profiles = [
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
        {
          id: 2,
          firstName: 'test-first-name2',
          lastName: 'test-last-name2',
          age: 14,
        },
      ];

      expect(service.getOne(2)).toEqual({
        id: 2,
        firstName: 'test-first-name2',
        lastName: 'test-last-name2',
        age: 14,
      });
    });
  });

  describe('update', () => {
    it('updates single profile', () => {
      service.profiles = [
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
        {
          id: 2,
          firstName: 'test-first-name2',
          lastName: 'test-last-name2',
          age: 14,
        },
      ];

      service.update(2, {
        firstName: 'test-first-name3',
        lastName: 'test-last-name3',
        age: 15,
      });

      expect(service.profiles).toEqual([
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
        {
          id: 2,
          firstName: 'test-first-name3',
          lastName: 'test-last-name3',
          age: 15,
        },
      ]);
    });
  });

  describe('delete', () => {
    it('deletes single profile', () => {
      service.profiles = [
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
        {
          id: 2,
          firstName: 'test-first-name2',
          lastName: 'test-last-name2',
          age: 14,
        },
      ];

      service.delete(2);

      expect(service.profiles).toEqual([
        {
          id: 1,
          firstName: 'test-first-name',
          lastName: 'test-last-name',
          age: 13,
        },
      ]);
    });
  });
});
