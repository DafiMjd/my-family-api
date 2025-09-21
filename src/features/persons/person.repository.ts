import {
  Person,
  CreatePersonRequest,
  UpdatePersonRequest,
} from "@/shared/types/person.types";
import prisma from "@/shared/database/prisma";

class PersonRepository {
  async findAll(): Promise<Person[]> {
    return await prisma.person.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Person | null> {
    return await prisma.person.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Person | null> {
    return await prisma.person.findFirst({
      where: { name },
    });
  }

  async create(personData: CreatePersonRequest): Promise<Person> {
    return await prisma.person.create({
      data: {
        ...personData,
        birthDate: new Date(personData.birthDate),
        deathDate: personData.deathDate ? new Date(personData.deathDate) : null,
      },
    });
  }

  async update(
    id: string,
    personData: UpdatePersonRequest
  ): Promise<Person | null> {
    try {
      const updateData: any = { ...personData };

      // Convert date strings to Date objects if provided
      if (personData.birthDate) {
        updateData.birthDate = new Date(personData.birthDate);
      }
      if (personData.deathDate !== undefined) {
        updateData.deathDate = personData.deathDate
          ? new Date(personData.deathDate)
          : null;
      }

      return await prisma.person.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      // If person doesn't exist, Prisma throws an error
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.person.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // If person doesn't exist, Prisma throws an error
      return false;
    }
  }

  async count(): Promise<number> {
    return await prisma.person.count();
  }

  async findByGender(gender: string): Promise<Person[]> {
    return await prisma.person.findMany({
      where: { gender: gender as any },
      orderBy: { createdAt: "desc" },
    });
  }

  async findLiving(): Promise<Person[]> {
    return await prisma.person.findMany({
      where: { deathDate: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findDeceased(): Promise<Person[]> {
    return await prisma.person.findMany({
      where: { deathDate: { not: null } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPersonsByIds(
    personId1: string,
    personId2: string
  ): Promise<Person[]> {
    return await prisma.person.findMany({
      where: {
        id: { in: [personId1, personId2] },
      },
    });
  }
}

export default new PersonRepository();
