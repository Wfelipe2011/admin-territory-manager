"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Territory, TerritoryTypes } from "./type";
import { Button } from "@/components/ui/button";
import {
  ChevronFirst,
  ChevronLast,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  PenIcon,
  EyeIcon,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { TerritoryFilter } from "@/components/TerritoryFilter";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { TerritoryImage } from "./TerritoryImage";
import { PageTitle } from "@/components/ui/PageTitle";
import { ImportTerritoryDialog } from "./ImportTerritoryDialog";

const axios = new AxiosAdapter();

type HttpResponse = {
  data: Territory[];
  limit: number;
  page: number;
  total: number;
};
interface SearchParams {
  search: string;
  type: string;
  page: string;
  limit: string;
  sort: string;
}

let debounceTimer: NodeJS.Timeout;

async function fetchTerritories(params: SearchParams): Promise<HttpResponse> {
  const axios = new AxiosAdapter("v2");
  const searchParams = new URLSearchParams(
    params as unknown as Record<string, string>
  );
  const query = searchParams.toString();
  const { data, status, message } = await axios.get<HttpResponse>(
    `territories?${query}`
  );
  if (status > 299) {
    throw new Error(message);
  }
  if (!data) {
    throw new Error("Data is missing");
  }
  return data;
}

async function fetchTerritoryTypes() {
  const axios = new AxiosAdapter("v1");
  const { data, status, message } = await axios.get<any>("territories/types");
  if (status > 299) {
    throw new Error(message);
  }
  if (!data) {
    throw new Error("Data is missing");
  }
  return data;
}

function ClientSideTerritory() {
  const [mode, setMode] = useState(MODE.LOADING);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [territoryTypes, setTerritoryTypes] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    limit: 10,
    page: 1,
    total: 0,
  });
  const [params, setParams] = useState<SearchParams>({
    search: "",
    type: "",
    page: "1",
    limit: "10",
    sort: "name",
  });

  const [editMode, setEditMode] = useState<number>(0);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const router = useRouter();

  const totalPage = Math.ceil(pagination.total / pagination.limit);

  const refresh = () => {
    fetchTerritories(params).then(({ data, limit, page, total }) => {
      setTerritories(data);
      setPagination({ limit, page, total });
    });
  };

  useEffect(() => {
    Promise.all([
      fetchTerritories(params).then(({ data, limit, page, total }) => {
        setTerritories(data);
        setPagination({ limit, page, total });
      }),
      fetchTerritoryTypes().then(setTerritoryTypes),
    ]).then(() => setMode(MODE.SCREEN));
  }, [params]);

  useEffect(() => {
    fetchTerritoryTypes()
      .then((types) => {
        setTerritoryTypes(types);
        setParams((prev) => ({ ...prev, type: types[0].id }));
      })
      .then(() => setMode(MODE.SCREEN));
  }, []);

  const handleEditMode = (value: number) => {
    if (editMode === value) {
      setEditMode(0);
      return;
    }
    setEditMode(value);
  };

  const updateTerritoryName = (value: string, territoryId: number) => {
    setTerritories((prev) =>
      prev.map((item) =>
        item.id === territoryId ? { ...item, name: value } : item
      )
    );
  };

  const updateTerritoryType = (value: number, territoryId: number) => {
    setTerritories((prev) =>
      prev.map((item) => {
        if (item.id === territoryId) {
          const newType = territoryTypes.find((type) => type.id === value);
          if (!newType) {
            return item;
          }
          return {
            ...item,
            typeId: value,
            type: newType,
          };
        }
        return item;
      })
    );
  };

  const submitUpdate = async (territoryId: number) => {
    const territory = territories.find((item) => item.id === territoryId);
    if (!territory) {
      return;
    }
    const { status, message } = await axios.put(`territories/${territoryId}`, {
      name: territory.name,
      typeId: territory.typeId,
      id: territory.id,
    });
    if (status > 299) {
      console.error(message);
      return;
    }
    setEditMode(0);
  };

  const onAddTerritory = async (data: { name: string; typeId: number }) => {
    const { status, message } = await axios.post("territories", data);
    if (status > 299) {
      console.error(message);
      return;
    }
    setParams((prev) => ({ ...prev, page: "1" }));
  };

  const handleImageUpload = async (
    territoryId: string | number,
    imageUrl: string
  ) => {
    if (!imageUrl) {
      return;
    }
    setTerritories((prev) =>
      prev.map((item) =>
        item.id === territoryId ? { ...item, imageUrl: imageUrl } : item
      )
    );
    setParams((prev) => ({ ...prev, page: "1" }));
  };

  const handlePage = (page: number) => {
    const newPage = pagination.page + page;
    if (newPage < 1 || newPage > totalPage) {
      return;
    }
    setParams((prev) => ({ ...prev, page: String(newPage) }));
  };

  const handleSearch = (value: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: value, page: "1" }));
    }, 500);
  };

  const setTabValue = (value: number) => {
    setParams((prev) => ({ ...prev, type: String(value), page: "1" }));
  };

  return (
    <RootModeScreen mode={mode}>
      <PageTitle title="Cadastro de Território" />
      <TerritoryFilter
        className="rounded-md shadow-md rounded-b-none bg-white my-4 p-4"
        title="Territórios"
        onSearch={(e) => handleSearch(e.target.value)}
        onTabChange={(e) => setTabValue(+e)}
        onAddTerritory={onAddTerritory}
        onImport={() => setIsImportOpen(true)}
        tabs={territoryTypes.map((type) => ({
          value: String(type.id),
          label: type.name,
        }))}
      ></TerritoryFilter>
      <ImportTerritoryDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={refresh}
      />
      <Table className="rounded-md shadow-md rounded-b-none bg-white">
        <TableCaption className="w-full bg-white p-2 rounded-md rounded-t-none shadow-md mt-0.5">
          <div className="flex justify-between">
            <div className="flex items-center">
              {pagination.page} de {totalPage}
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="p-2 mr-1"
                variant="outline"
                onClick={() => setParams((prev) => ({ ...prev, page: "1" }))}
                disabled={pagination.page === 1}
              >
                <ChevronFirst />
              </Button>
              <Button
                className="p-2"
                variant="outline"
                onClick={() => handlePage(-1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft />
              </Button>
              <Button
                className="p-2"
                variant="outline"
                onClick={() => handlePage(1)}
                disabled={pagination.page === totalPage}
              >
                <ChevronRight />
              </Button>
              <Button
                className="p-2 ml-1"
                variant="outline"
                onClick={() =>
                  setParams((prev) => ({ ...prev, page: String(totalPage) }))
                }
                disabled={pagination.page === totalPage}
              >
                <ChevronLast />
              </Button>
            </div>
          </div>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Territorio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Mapa</TableHead>
            <TableHead className="flex items-center justify-center">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {territories.map((territory) => {
            return (
              <TableRow key={territory.id}>
                <CellTerritoryName
                  isEditMode={territory.id === editMode}
                  name={territory.name}
                  updateName={(value) =>
                    updateTerritoryName(value, territory.id)
                  }
                />
                <CellTerritoryType
                  isEditMode={territory.id === editMode}
                  typeName={territory.type.name}
                  typeId={territory.typeId}
                  updateType={(value) =>
                    updateTerritoryType(value, territory.id)
                  }
                  territoryTypes={territoryTypes}
                />
                <TableCell>
                  <TerritoryImage
                    imageUrl={territory.imageUrl}
                    name={territory.name}
                    territoryId={territory.id}
                    onImageUpload={handleImageUpload}
                  />
                </TableCell>
                <CellTerritoryAction
                  actions={[
                    {
                      toggleMode: editMode === territory.id,
                      setToggleMode: () => handleEditMode(territory.id),
                      submitAction: () => submitUpdate(territory.id),
                      icon: {
                        jsx: <CheckIcon />,
                        className: "text-green-500 hover:text-green-700",
                      },
                      secondaryIcon: {
                        jsx: <PenIcon />,
                        className: "text-blue-500 hover:text-blue-700",
                      },
                    },
                    {
                      toggleMode: false,
                      setToggleMode: () => {
                        router.push(`/cadastro/territorio/${territory.id}`);
                      },
                      submitAction: () => {
                        router.push(`/cadastro/territorio/${territory.id}`);
                      },
                      icon: {
                        jsx: <EyeIcon />,
                        className: "text-yellow-500 hover:text-yellow-700",
                      },
                      secondaryIcon: {
                        jsx: <EyeIcon />,
                        className: "text-yellow-500 hover:text-yellow-700",
                      },
                    },
                  ]}
                />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </RootModeScreen>
  );
}

interface TerritoryNameProps {
  isEditMode: boolean;
  name: string;
  updateName: (value: string) => void;
}
function CellTerritoryName({
  isEditMode,
  name,
  updateName,
}: TerritoryNameProps) {
  if (isEditMode) {
    return (
      <TableCell>
        <Input
          type="text"
          value={name}
          name="name"
          onChange={({ target }) => updateName(target.value)}
        />
      </TableCell>
    );
  }

  return <TableCell>{name}</TableCell>;
}

interface TerritoryTypeProps {
  isEditMode: boolean;
  typeName: string;
  typeId: number;
  updateType: (value: number) => void;
  territoryTypes: TerritoryTypes[];
}
function CellTerritoryType({
  isEditMode,
  typeName,
  typeId,
  updateType,
  territoryTypes,
}: TerritoryTypeProps) {
  if (isEditMode) {
    return (
      <TableCell>
        <Select
          value={String(typeId)}
          onValueChange={(value) => updateType(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={typeName} />
          </SelectTrigger>
          <SelectContent defaultValue={String(typeId)}>
            {territoryTypes.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    );
  }

  return <TableCell>{typeName}</TableCell>;
}

interface CellTerritoryActionProps {
  actions: {
    icon: {
      jsx: React.ReactNode;
      className: string;
    };
    secondaryIcon: {
      jsx: React.ReactNode;
      className: string;
    };
    toggleMode: boolean;
    setToggleMode: (value: boolean) => void;
    submitAction: () => void;
  }[];
}
function CellTerritoryAction({ actions }: CellTerritoryActionProps) {
  return (
    <TableCell className="flex gap-1 items-center justify-center">
      {actions.map((action, index) => {
        if (action.toggleMode) {
          return (
            <Button
              key={index}
              variant="outline"
              className={action.icon.className}
              onClick={action.submitAction}
            >
              {action.icon.jsx}
            </Button>
          );
        }
        return (
          <Button
            key={index}
            variant="outline"
            className={action.secondaryIcon.className}
            onClick={() => action.setToggleMode(true)}
          >
            {action.secondaryIcon.jsx}
          </Button>
        );
      })}
    </TableCell>
  );
}

export default ClientSideTerritory;
