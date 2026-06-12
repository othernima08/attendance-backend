import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: DepartmentsService;

  const mockDepartmentsService = {
    create: jest.fn((name) => {
      return Promise.resolve({ id: 'uuid-1', name });
    }),
    findAll: jest.fn(() => {
      return Promise.resolve([{ id: 'uuid-1', name: 'IT' }]);
    }),
    findOne: jest.fn((id) => {
      return Promise.resolve({ id, name: 'IT' });
    }),
    update: jest.fn((id, name) => {
      return Promise.resolve({ id, name });
    }),
    remove: jest.fn((id) => {
      return Promise.resolve({ message: `Department dengan ID "${id}" tidak ditemukan` }); // Meniru response delete
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a department', async () => {
    const result = await controller.create('HR');
    expect(result).toEqual({ id: 'uuid-1', name: 'HR' });
    expect(service.create).toHaveBeenCalledWith('HR');
  });

  it('should find all departments', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([{ id: 'uuid-1', name: 'IT' }]);
    expect(service.findAll).toHaveBeenCalled();
  });
});